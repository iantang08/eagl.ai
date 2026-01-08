module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
        },
      },
    ],
    'react-native-paper/babel',
  ],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
};
