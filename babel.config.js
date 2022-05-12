module.exports = (api) => (
  api.env(['test'])
    ? {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
      ],
    }
    : {
      presets: [
        ['@babel/preset-env', { modules: false }],
        '@babel/preset-typescript',
      ],
    });
