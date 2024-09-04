import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Vue3ProgressPlugin } from '@marcoschulte/vue3-progress';
import mitt from 'mitt';
import 'vue3-perfect-scrollbar/dist/vue3-perfect-scrollbar.css';
import '@marcoschulte/vue3-progress/dist/index.css';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';
import '@fortawesome/fontawesome-free/scss/brands.scss';
import '@fortawesome/fontawesome-free/scss/v4-shims.scss';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap';
import './scss/styles.scss';
import vSelect from "vue-select";
import VueBase64FileUpload from 'vue-base64-file-upload';
import PerfectScrollbar from 'vue3-perfect-scrollbar';
import App from './App.vue';
import router from './router';

import Card from '@/assets/components/bootstrap/Card.vue';
import CardBody from '@/assets/components/bootstrap/CardBody.vue';
import CardHeader from '@/assets/components/bootstrap/CardHeader.vue';
import CardFooter from '@/assets/components/bootstrap/CardFooter.vue';
import CardGroup from '@/assets/components/bootstrap/CardGroup.vue';
import CardImgOverlay from '@/assets/components/bootstrap/CardImgOverlay.vue';
import CardExpandToggler from '@/assets/components/bootstrap/CardExpandToggler.vue';
import vue3Spinner from 'vue3-spinner';
import { PaginationBar } from 'v-page'
//import VueQuillEditor from 'vue-quill-editor';

// require styles
//import 'quill/dist/quill.core.css'
//import 'quill/dist/quill.snow.css'
//import 'quill/dist/quill.bubble.css'

const emitter = mitt();
const app = createApp(App);

app.component('v-select', vSelect)
app.component('Card', Card);
app.component('CardBody', CardBody);
app.component('CardHeader', CardHeader);
app.component('CardFooter', CardFooter);
app.component('CardGroup', CardGroup);
app.component('CardImgOverlay', CardImgOverlay);
app.component('CardExpandToggler', CardExpandToggler);
app.component('VueBase64FileUpload', VueBase64FileUpload);

//app.component('VueQuillEditor', VueQuillEditor);

app.use(createPinia());
app.use(router);
app.use(Vue3ProgressPlugin);
app.use(PerfectScrollbar);
app.use(vue3Spinner)
app.use(PaginationBar)

app.config.globalProperties.emitter = emitter;
app.mount('#app');
