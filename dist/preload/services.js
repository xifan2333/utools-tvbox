const axios = require('axios')
const http = axios.create({
  timeout: 5 * 60 * 1000,
  headers: {
    'Content-Type': 'application/json'
  }
})


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
      window.utools.dbStorage.setItem('sources', [
        {
          id: 'heimei',
          api: 'https://json.heimuer.xyz',
          name: '黑莓影视',
          detail: 'https://heimuer.tv',
          enabled: true
        },
        {
          id: 'ffzy',
          api: 'http://ffzy5.tv',
          name: '非凡影视',
          detail: 'http://ffzy5.tv',
          enabled: true
        }
      ])
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
        : videoService.getActiveSource()

      if (!source) {
        throw new Error('未找到可用的视频源')
      }

      const detailUrl = `${source.detail}/index.php/vod/detail/id/${id}.html`
      const response = await http.get(detailUrl)
      const html = response.data

      if (!html || typeof html !== 'string') {
        throw new Error('获取到的页面内容无效')
      }

      const links = extractVideoLinks(html)

      if (links.length === 0) {
        return {
          code: 404,
          msg: '未找到有效的视频链接',
          episodes: [],
          detailUrl: detailUrl
        }
      }

      return {
        episodes: links,
        detailUrl: detailUrl,
        sourceId: source.id,
        sourceName: source.name
      }
    } catch (error) {
      console.error('获取视频详情失败:', error)
      return {
        code: 400,
        msg: error.message || '获取详情失败，请稍后重试',
        episodes: []
      }
    }
  }
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
        sourceName: source.name
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
    const matches = html.match(pattern) || []
    matches.forEach(link => {
      // 清理链接
      let cleanLink = link
      if (cleanLink.startsWith('$')) {
        cleanLink = cleanLink.substring(1)
      }
      cleanLink = cleanLink.replace(/['"]/g, '')

      // 验证链接
      try {
        const url = new URL(cleanLink)
        if (url.protocol.startsWith('http') && cleanLink.endsWith('.m3u8')) {
          links.add(cleanLink)
        }
      } catch (e) {
        // 忽略无效的URL
      }
    })
  })

  return Array.from(links)
}

// 历史记录服务
const historyService = {
  // 添加或更新历史记录
  addHistory: (video) => {
    const histories = window.utools.dbStorage.getItem('histories') || []
    const index = histories.findIndex(h => h.vod_id === video.vod_id)

    const historyItem = {
      vod_id: video.vod_id,
      vod_name: video.vod_name,
      vod_remarks: video.vod_remarks || '',
      vod_play_from: video.vod_play_from || '',
      type_id: video.type_id || '',
      type_name: video.type_name || '',
      episodes: video.episodes || [],
      currentEpisodeIndex: video.currentEpisodeIndex || 0,
      currentEpisode: video.currentEpisode || '',
      currentTime: video.currentTime || 0,
      duration: video.duration || 0,
      updateTime: Date.now()
    }

    if (index > -1) {
      histories[index] = historyItem
    } else {
      histories.unshift(historyItem)
    }

    // 限制历史记录数量为100条
    if (histories.length > 100) {
      histories.pop()
    }

    window.utools.dbStorage.setItem('histories', histories)
  },

  // 获取历史记录列表
  getHistories: () => {
    return window.utools.dbStorage.getItem('histories') || []
  },

  // 删除单条历史记录
  removeHistory: (vod_id) => {
    const histories = window.utools.dbStorage.getItem('histories') || []
    const newHistories = histories.filter(h => h.vod_id !== vod_id)
    window.utools.dbStorage.setItem('histories', newHistories)
  },

  // 清空所有历史记录
  clearHistories: () => {
    window.utools.dbStorage.setItem('histories', [])
  },

  // 更新观看进度和分集
  updateProgress: (vod_id, currentTime, currentEpisodeIndex, currentEpisode) => {
    const histories = window.utools.dbStorage.getItem('histories') || []
    const index = histories.findIndex(h => h.vod_id === vod_id)
    if (index > -1) {
      histories[index].currentTime = currentTime
      if (typeof currentEpisodeIndex === 'number') histories[index].currentEpisodeIndex = currentEpisodeIndex
      if (currentEpisode) histories[index].currentEpisode = currentEpisode
      histories[index].updateTime = Date.now()
      window.utools.dbStorage.setItem('histories', histories)
    }
  }
}

// 监听 uTools 事件
window.utools.onPluginEnter(({ code, type, payload }) => {
  // 根据不同的功能代码跳转到不同的页面
  switch (code) {
    case 'tv-search':
      window.location.hash = '/search'
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
  history: historyService
}



