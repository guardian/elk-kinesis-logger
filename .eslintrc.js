module.exports = {
    env: {
        es6: true,
        node: true,
        mocha: true
    },
    extends: ['eslint:recommended', 'prettier'],
    plugins: ['standard', 'promise', 'prettier'],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module'
    },
    rules: {
        // prettier settings
        'prettier/prettier': [
            'error',
            {
                singleQuote: true,
                bracketSpacing: true,
                tabWidth: 2
            }
        ],
        'prefer-const': 'error',
        semi: ['error', 'always'],
        'comma-dangle': ['error', 'never']
    }
};
