module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": [
        "eslint:recommended"
    ],
    "plugins": [
        "standard",
        "promise"
    ],
    "parserOptions": {
        "ecmaVersion": 6,
        "sourceType": "module"
    },
    "rules": {
        "prefer-const": "error",
        "semi": ["error", "always"],
        "comma-dangle": ["error", "never"]
    }
};
