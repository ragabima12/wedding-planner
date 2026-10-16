import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  { name: 'app/files', files: ['**/*.{ts,mts,tsx,vue}'] },
  globalIgnores(['**/dist/**', '**/coverage/**', '**/node_modules/**']),
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  ...pluginVueA11y.configs['flat/recommended'],
  {
    rules: {
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/define-macros-order': [
        'error',
        { order: ['defineOptions', 'defineProps', 'defineEmits', 'defineModel', 'defineSlots'] },
      ],
      'vue/require-explicit-emits': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
      'vuejs-accessibility/label-has-for': [
        'error',
        {
          required: { some: ['nesting', 'id'] },
          controlComponents: ['BaseCheckbox', 'TextInput', 'MoneyInput', 'SelectInput', 'TextArea'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  skipFormatting,
)
