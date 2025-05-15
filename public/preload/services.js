const axios = require('axios')
const fs = require('fs')
const path = require('path')
const http = axios.create({
  timeout: 5 * 60 * 1000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 解析接口管理
const parseApiService = {
  // 获取解析接口
  getParseApi: () => {
    return window.utools.dbStorage.getItem('parseApi') || 'https://jx.xmflv.com/?url='
  },

  // 设置解析接口
  setParseApi: (url) => {
    if (!url) {
      throw new Error('解析接口地址不能为空')
    }
    window.utools.dbStorage.setItem('parseApi', url)
  }
}

// 添加请求拦截器（可选）
http.interceptors.request.use(
  config => {
    // 这里可以添加请求前的处理，比如显示加载状态
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 主题存储服务
const themeService = {
  // 获取主题
  getTheme: () => {
    return window.utools.dbStorage.getItem('theme') || 'light'
  },
  // 设置主题
  setTheme: (theme) => {
    window.utools.dbStorage.setItem('theme', theme)
  }
}

const videoService = {
  // 初始化源列表
  initSource: async () => {
    const sources = window.utools.dbStorage.getItem('sources')
    if (!sources) {
      window.utools.dbStorage.setItem('sources', [])
    }
  },
  // 获取所有源
  getSources: () => {
    return window.utools.dbStorage.getItem('sources') || []
  },
  // 添加新源
  addSource: async (source) => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    sources.push(source)
    window.utools.dbStorage.setItem('sources', sources)
  },
  // 切换站点启用状态
  enableSource: (sourceId) => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    const updatedSources = sources.map(source => ({
      ...source,
      enabled: source.id === sourceId ? true : source.enabled
    }))
    window.utools.dbStorage.setItem('sources', updatedSources)
  },
  // 禁用站点
  disableSource: (sourceId) => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    const updatedSources = sources.map(source => ({
      ...source,
      enabled: source.id === sourceId ? false : source.enabled
    }))
    window.utools.dbStorage.setItem('sources', updatedSources)
  },
  // 删除站点
  removeSource: (sourceId) => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    const updatedSources = sources.filter(source => source.id !== sourceId)
    window.utools.dbStorage.setItem('sources', updatedSources)
  },
  // 更新站点
  updateSource: (sourceId, updatedData) => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    const sourceIndex = sources.findIndex(s => s.id === sourceId)

    if (sourceIndex === -1) {
      throw new Error('未找到指定的站点')
    }

    // 验证更新后的数据
    const validation = videoService.validateSource({
      ...sources[sourceIndex],
      ...updatedData
    })

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // 更新站点数据
    sources[sourceIndex] = {
      ...sources[sourceIndex],
      ...updatedData
    }

    window.utools.dbStorage.setItem('sources', sources)
    return sources[sourceIndex]
  },
  // 获取所有启用的源
  getEnabledSources: () => {
    const sources = window.utools.dbStorage.getItem('sources') || []
    return sources.filter(source => source.enabled)
  },
  // 搜索视频
  search: async (query, sourceId = null) => {
    try {
      const sources = videoService.getSources()
      if (sources.length === 0) {
        return {
          code: 400,
          msg: '未找到可用的视频源，请检查设置',
          list: []
        }
      }

      // 如果指定了源ID，只搜索该源
      if (sourceId) {
        const source = sources.find(s => s.id === sourceId)
        if (!source) {
          return {
            code: 400,
            msg: '未找到指定的视频源',
            list: []
          }
        }
        return await searchSingleSource(source, query)
      }

      // 否则搜索所有启用的源
      const enabledSources = sources.filter(s => s.enabled)
      if (enabledSources.length === 0) {
        return {
          code: 400,
          msg: '没有启用的视频源，请在设置中启用至少一个源',
          list: []
        }
      }

      const searchPromises = enabledSources.map(source => searchSingleSource(source, query))
      const results = await Promise.allSettled(searchPromises)

      // 合并所有成功的结果
      const allResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .filter(r => r.code === 200)
        .reduce((acc, curr) => {
          return [...acc, ...curr.list]
        }, [])

      return {
        code: 200,
        msg: '搜索成功',
        list: allResults,
        total: allResults.length
      }
    } catch (error) {
      console.error('搜索请求失败，详细错误:', error)
      return {
        code: 400,
        msg: error.message || '搜索服务暂时不可用，请稍后再试',
        list: []
      }
    }
  },
  // 获取视频详情
  getDetail: async (id, sourceId = null) => {
    try {
      const source = sourceId
        ? videoService.getSources().find(s => s.id === sourceId)
        : videoService.getSources().find(s => s.enabled)

      if (!source) {
        throw new Error('未找到可用的视频源')
      }

      const detailUrl = `${source.detail}/${id}.html`

      const response = await http.get(detailUrl)
      const html = response.data

      if (!html || typeof html !== 'string') {
        throw new Error('获取到的页面内容无效')
      }

      // 如果是官采站，使用新的解析方法
      if (source.isOfficial) {
        const result = await parseDetailPage(html)
        if (result.code === 200) {
          // 将 urllist 转换为统一的 episodes 格式
          const episodes = result.urllist.reduce((acc, platform) => {
            return [...acc, ...platform.episodes]
          }, [])
          
          return {
            code: 200,
            episodes,
            detailUrl,
            sourceId: source.id,
            sourceName: source.name,
            platform: result.urllist[0]?.platform || ''
          }
        }
        throw new Error(result.msg || '解析详情页失败')
      }

      // 非官采站使用原有的 m3u8 提取方法
      const links = extractVideoLinks(html)
      if (links.length === 0) {
        return {
          code: 404,
          msg: '未找到有效的视频链接',
          episodes: [],
          detailUrl: detailUrl,
          platform: ''
        }
      }

      return {
        code: 200,
        episodes: links,
        detailUrl: detailUrl,
        sourceId: source.id,
        sourceName: source.name,
        platform: '' // 非官采站返回空字符串
      }
    } catch (error) {
      console.error('获取视频详情失败:', error)
      return {
        code: 400,
        msg: error.message || '获取详情失败，请稍后重试',
        episodes: [],
        platform: ''
      }
    }
  },
  // 导出站点配置
  exportSources: async (includeDisabled = true) => {
    try {
      const sources = window.utools.dbStorage.getItem('sources') || []
      const exportData = {
        parse: parseApiService.getParseApi(),
        sources: includeDisabled ? sources : sources.filter(s => s.enabled)
      }

      const jsonStr = JSON.stringify(exportData, null, 2)

      // 使用 uTools API 保存文件
      const options = {
        title: '导出站点配置',
        defaultPath: `video-sources-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON', extensions: ['json'] }
        ]
      }
      const result = await window.utools.showSaveDialog(options)
      if (result.canceled) {
        return {
          code: 200,
          msg: '已取消导出',
          count: 0
        }
      }

      // 直接将result作为filePath（result就是字符串路径）
      const filePath = result

      // 确保目录存在
      const dir = path.dirname(filePath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // 写入文件
      try {
        fs.writeFileSync(filePath, jsonStr, 'utf8')
      } catch (e) {
        return {
          code: 400,
          msg: e.message || '写入文件失败',
          count: 0
        }
      }

      // 检查文件是否真实存在
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath)
        if (stat.size > 0) {
          return {
            code: 200,
            msg: '导出成功',
            count: exportData.sources.length
          }
        }
        return {
          code: 400,
          msg: '导出失败，文件为空',
          count: 0
        }
      }

    } catch (error) {
      console.error('导出站点配置失败:', error)
      return {
        code: 400,
        msg: error.message || '导出失败',
        count: 0
      }
    }
  },

  // 验证源数据
  validateSource: (source) => {
    if (!source || typeof source !== 'object') {
      return { valid: false, error: '无效的源数据格式' }
    }

    const requiredFields = ['id', 'name', 'api', 'detail']
    for (const field of requiredFields) {
      if (!source[field]) {
        return { valid: false, error: `缺少必填字段: ${field}` }
      }
    }

    try {
      new URL(source.api)
      new URL(source.detail)
    } catch (e) {
      return { valid: false, error: 'API或详情页URL格式无效' }
    }

    // 验证 isOfficial 字段类型
    if (source.isOfficial !== undefined && typeof source.isOfficial !== 'boolean') {
      return { valid: false, error: 'isOfficial 字段必须是布尔值' }
    }

    return { valid: true }
  },

  // 合并源数据
  mergeSources: (existingSources, newSources, mode = 'merge') => {
    if (mode === 'replace') {
      return newSources
    }

    const merged = [...existingSources]
    for (const newSource of newSources) {
      const existingIndex = merged.findIndex(s => s.id === newSource.id)
      if (existingIndex > -1) {
        // 保留 isOfficial 字段
        const isOfficial = newSource.isOfficial !== undefined ? newSource.isOfficial : merged[existingIndex].isOfficial
        merged[existingIndex] = { ...merged[existingIndex], ...newSource, isOfficial }
      } else {
        merged.push(newSource)
      }
    }
    return merged
  },

  // 导入站点配置（自动根据api字段去重合并，无需模式）
  importSources: async (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在: ' + filePath)
      }
      const text = fs.readFileSync(filePath, 'utf8')
      const importData = JSON.parse(text)

      if (!importData.sources || !Array.isArray(importData.sources)) {
        throw new Error('无效的导入文件格式，缺少sources数组')
      }

      // 验证每个源
      const validationResults = importData.sources.map(source => ({
        source,
        ...videoService.validateSource(source)
      }))
      const invalidSources = validationResults.filter(r => !r.valid)
      if (invalidSources.length > 0) {
        throw new Error(`发现 ${invalidSources.length} 个无效的源配置: ${invalidSources.map(r => r.error).join(', ')}`)
      }

      // 统计新增和更新
      const existingSources = window.utools.dbStorage.getItem('sources') || []
      const existingApiSet = new Set(existingSources.map(s => s.api))
      let added = 0, updated = 0
      for (const src of importData.sources) {
        if (src.api && existingApiSet.has(src.api)) {
          updated++
        } else if (src.api) {
          added++
        }
      }

      // 合并逻辑
      const apiMap = new Map()
      for (const src of existingSources) {
        if (src.api) apiMap.set(src.api, src)
      }
      for (const src of importData.sources) {
        if (src.api) apiMap.set(src.api, src)
      }
      const mergedSources = Array.from(apiMap.values())
      window.utools.dbStorage.setItem('sources', mergedSources)

      // 如果存在parse字段，更新解析接口
      if (importData.parse) {
        try {
          parseApiService.setParseApi(importData.parse)
        } catch (error) {
          console.warn('更新解析接口失败:', error)
        }
      }

      return {
        code: 200,
        msg: '导入成功',
        total: importData.sources.length,
        final: mergedSources.length,
        added,
        updated,
        parseUpdated: !!importData.parse
      }
    } catch (error) {
      console.error('导入站点配置失败:', error)
      return {
        code: 400,
        msg: error.message || '导入失败',
        total: 0,
        final: 0,
        added: 0,
        updated: 0,
        parseUpdated: false
      }
    }
  },
}

// 搜索单个源
const searchSingleSource = async (source, query) => {
  try {
    const apiUrl = `${source.api}/api.php/provide/vod/?ac=list&wd=${encodeURIComponent(query || '')}`
    const response = await http.get(apiUrl)

    if (!response.data) {
      throw new Error('API返回数据为空')
    }

    let data = response.data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        console.error('解析API响应JSON失败:', e)
        throw new Error('API返回数据格式错误')
      }
    }

    // 检查返回的数据格式
    if (data.code === 1 && Array.isArray(data.list)) {
      // 为每个结果添加来源信息
      const items = data.list.map(item => ({
        ...item,
        sourceId: source.id,
        sourceName: source.name,
        isOfficial: !!source.isOfficial
      }))

      return {
        code: 200,
        msg: data.msg || '搜索成功',
        list: items,
        page: data.page,
        pagecount: data.pagecount,
        limit: data.limit,
        total: data.total
      }
    } else {
      throw new Error('API返回数据格式不正确')
    }
  } catch (error) {
    console.error(`搜索源 ${source.name} 失败:`, error)
    return {
      code: 400,
      msg: error.message || '搜索失败',
      list: [],
      sourceId: source.id
    }
  }
}

// 提取视频链接的通用方法
const extractVideoLinks = (html) => {
  const links = new Set()
  const episodes = []

  // 匹配所有可能的视频链接
  const patterns = [
    // m3u8 链接
    /https?:\/\/[^"'\s]+?\.m3u8/g,
    // 带前缀的链接
    /\$https?:\/\/[^"'\s]+?\.m3u8/g,
    // JSON格式的链接
    /(?<="url":")(https?:\/\/[^"'\s]+?\.m3u8)(?=")/g,
    /(?<='url':')(https?:\/\/[^"'\s]+?\.m3u8)(?=')/g,
    // 其他可能的格式
    /https?:\/\/[^"'\s]+?\/\d{8}\/\d+_[a-f0-9]+\/index\.m3u8/g
  ]

  // 使用所有模式匹配
  patterns.forEach(pattern => {
    const matches = html.matchAll(pattern) || []
    for (const match of matches) {
      // 清理链接
      let cleanLink = match[0]
      if (cleanLink.startsWith('$')) {
        cleanLink = cleanLink.substring(1)
      }
      cleanLink = cleanLink.replace(/['"]/g, '')

      // 如果是带集数的格式，提取集数
      if (match[1] && match[2]) {
        const episodeNumber = parseInt(match[1])
        cleanLink = match[2]
        episodes.push({
          number: episodeNumber,
          url: `${parseApiService.getParseApi()}${encodeURIComponent(cleanLink)}`
        })
      }

      // 验证链接并转换为iframe链接
      try {
        const url = new URL(cleanLink)
        if (url.protocol.startsWith('http') && cleanLink.endsWith('.m3u8')) {
          links.add(`${parseApiService.getParseApi()}${encodeURIComponent(cleanLink)}`)
        }
      } catch (e) {
        // 忽略无效的URL
      }
    }
  })

  // 如果有带集数的链接，按集数排序并返回URL数组
  if (episodes.length > 0) {
    episodes.sort((a, b) => a.number - b.number)
    return episodes.map(ep => ep.url)
  }

  // 否则返回普通链接数组
  return Array.from(links)
}

// 解析详情页
const parseDetailPage = async (html) => {
  try {
    // 按平台分组的播放地址
    const platformUrls = {
      youku: [],
      iqiyi: [],
      qq: [],
      mgtv: [],
      bilibili: []
    }

    // 各平台的正则表达式
    const patterns = {
      youku: /[^"'\s]+(https?:\/\/v\.youku\.com\/v_show\/[^"'\s]+\.html)/g,
      iqiyi: /[^"'\s]+(https?:\/\/www\.iqiyi\.com\/v_[^"'\s]+\.html)/g,
      qq: /[^"'\s]+(https?:\/\/v\.qq\.com\/x\/cover\/[^"'\s]+\.html)/g,
      mgtv: /[^"'\s]+(https?:\/\/www\.mgtv\.com\/[^"'\s]+\.html)/g,
      bilibili: /[^"'\s]+(https?:\/\/www\.bilibili\.com\/[^"'\s]+)/g
    }

    // 使用所有模式匹配
    Object.entries(patterns).forEach(([platform, pattern]) => {
      const matches = html.matchAll(pattern) || []
      for (const match of matches) {
        const url = match[1].trim()
        if (!platformUrls[platform].includes(url)) {
          platformUrls[platform].push(url)
        }
      }
    })

    // 转换为平台和分集数组格式
    const platformEpisodes = Object.entries(platformUrls)
      .filter(([_, urls]) => urls.length > 0)
      .map(([platform, urls]) => ({
        platform,
        episodes: urls.map(url => `${parseApiService.getParseApi()}${encodeURIComponent(url)}`)
      }))

    if (platformEpisodes.length === 0) {
      return {
        code: 404,
        msg: '未找到有效的播放地址',
        urllist: []
      }
    }

    return {
      code: 200,
      urllist: platformEpisodes
    }
  } catch (error) {
    console.error('解析详情页失败:', error)
    return {
      code: 400,
      msg: '解析详情页失败',
      raw: html,
      error: error.message,
      urllist: []
    }
  }
}

// 历史记录服务
const historyService = {
  // 添加或更新历史记录
  addHistory: (video) => {
    const histories = window.utools.dbStorage.getItem('histories') || [];
    const index = histories.findIndex(h => h.vod_id === video.vod_id && h.sourceId === video.sourceId);

    // 统一结构
    const historyItem = {
      vod_id: video.vod_id,
      vod_name: video.vod_name,
      sourceId: video.sourceId,
      sourceName: video.sourceName,
      platform: video.platform || '',
      episodeIndex: typeof video.episodeIndex === 'number' ? video.episodeIndex : 0,
      episodeUrl: video.episodeUrl || '',
      lastTime: typeof video.lastTime === 'number' ? video.lastTime : 0,
      updateTime: Date.now()
    };

    if (index > -1) {
      histories[index] = historyItem;
    } else {
      histories.unshift(historyItem);
    }

    // 限制历史记录数量为100条
    if (histories.length > 100) {
      histories.pop();
    }

    window.utools.dbStorage.setItem('histories', histories);
  },

  // 获取历史记录列表
  getHistories: () => {
    return window.utools.dbStorage.getItem('histories') || [];
  },

  // 删除单条历史记录
  removeHistory: (vod_id, sourceId) => {
    const histories = window.utools.dbStorage.getItem('histories') || [];
    const newHistories = histories.filter(h => !(h.vod_id === vod_id && h.sourceId === sourceId));
    window.utools.dbStorage.setItem('histories', newHistories);
  },

  // 清空所有历史记录
  clearHistories: () => {
    window.utools.dbStorage.setItem('histories', []);
  },

  // 更新观看进度和分集
  updateProgress: (vod_id, sourceId, lastTime, episodeIndex, episodeUrl) => {
    const histories = window.utools.dbStorage.getItem('histories') || [];
    const index = histories.findIndex(h => h.vod_id === vod_id && h.sourceId === sourceId);
    if (index > -1) {
      if (typeof lastTime === 'number') histories[index].lastTime = lastTime;
      if (typeof episodeIndex === 'number') histories[index].episodeIndex = episodeIndex;
      if (episodeUrl) histories[index].episodeUrl = episodeUrl;
      histories[index].updateTime = Date.now();
      window.utools.dbStorage.setItem('histories', histories);
    }
  }
};

// 监听 uTools 事件
window.utools.onPluginEnter(({ code, type, payload }) => {
  // 根据不同的功能代码跳转到不同的页面
  switch (code) {
    case 'tv-search':
      if (type === 'over') {
        // 当是直接输入剧名时，将关键词作为参数传递
        window.location.hash = `/search?keyword=${encodeURIComponent(payload)}`
      } else {
        // 其他情况保持原有逻辑
        window.location.hash = '/search'
      }
      break
    case 'tv-history':
      window.location.hash = '/history'
      break
    case 'tv-settings':
      window.location.hash = '/settings'
      break
  }
})

window.services = {
  video: videoService,
  theme: themeService,
  history: historyService,
  parseApi: parseApiService
}



