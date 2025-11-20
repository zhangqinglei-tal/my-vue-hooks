import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import CounterDemo from '../../components/CounterDemo.vue'
import ToggleDemo from '../../components/ToggleDemo.vue'
import LocalStorageDemo from '../../components/LocalStorageDemo.vue'
import FetchDemo from '../../components/FetchDemo.vue'
import AxiosFetchDemo from '../../components/AxiosFetchDemo.vue'
import TableRequestDemo from '../../components/TableRequestDemo.vue'
import TableStaticDemo from '../../components/TableStaticDemo.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 注册全局组件
    app.component('CounterDemo', CounterDemo)
    app.component('ToggleDemo', ToggleDemo)
    app.component('LocalStorageDemo', LocalStorageDemo)
    app.component('FetchDemo', FetchDemo)
    app.component('AxiosFetchDemo', AxiosFetchDemo)
    app.component('TableRequestDemo', TableRequestDemo)
    app.component('TableStaticDemo', TableStaticDemo)
  }
}

