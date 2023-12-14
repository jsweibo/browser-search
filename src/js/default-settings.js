const DEFAULT_SETTINGS = {
  DEFAULT_ACTIVE_RULE_OPTIONS: {
    contextMenu: false,
    search: true,
  },
  RESERVED_BANG_PREFIX: '__prefix__',
  bangPrefix: '/',
  index: 0,
  rules: [
    [
      'b',
      'https://www.baidu.com/s?ie=utf-8&wd=',
      {
        contextMenu: true,
      },
    ],
    [
      'bi',
      'https://www.bing.com/search?q=',
      {
        contextMenu: true,
      },
    ],
    ['d', 'https://duckduckgo.com/?q='],
    [
      'g',
      'https://www.google.com/search?q=',
      {
        contextMenu: true,
      },
    ],
    ['y', 'https://yandex.com/search/?text='],
  ],
};
