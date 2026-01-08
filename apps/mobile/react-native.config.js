module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null, // disable auto-linking, we'll manually link fonts
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
