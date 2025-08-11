<script setup>
import { ref, watch, onMounted } from 'vue'
import { getRequest,postRequest,deleteRequest } from '@/composables/api.js'
import quillEditor from '@/assets/components/plugins/QuillEditor.vue';
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import draggable from 'vuedraggable'
import { marked } from 'marked'
import DOMPurify from 'dompurify'



const props = defineProps({
  isEdit: Boolean,
  landingPageId: String
});

const router = useRouter()
let username = ref(null)
let token = ref(null)
let role = ref(null)
let spin_loading = ref(false)
let notification_message = ref(null)
let title = ref(null)
let content = ref(null)
let sections =ref([])
let number_of_section = ref(Math.max(0, ...sections.value.map(s => s.order_index)) + 1)
let prompt = ref(null)
let answer = ref(null)
let messages = ref([])
let chatgpt_suggestions = ref(null)

const formComponents = ref([
  { type: 'text', label: 'Text' },
  { type: 'textarea', label: 'Textarea' },
  { type: 'number', label: 'Number' },
  { type: 'date', label: 'Date' },
  { type: 'select', label: 'Select' },
  { type: 'radio', label: 'Radio' },
  { type: 'checkbox', label: 'Checkbox' }
])

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")

const formData = ref({})

function onComponentDropped(event, section) {
  updateComponentOrder(section)
}

function cloneComponent(component, section = null) {
  if(section){
    console.log(section.components.length)
  }
  const id = Date.now() + Math.random()
  const fieldName = `${component.type}_${id}`
  const isOptionType = ['select', 'radio', 'checkbox'].includes(component.type)
  formData.value[fieldName] = ''
  return {
    ...component,
    id,
    fieldName,
    label: '',         // the question, to be entered by admin
    isEditing: true,
    options: isOptionType ? ['Option 1', 'Option 2'] : [],
    is_required: false, // ✅ default to false
    order_index: section ? section.components.length : 1    // show input field for the question
  }
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}

function deleteConversations(){
    messages.value = []
    prompt.value = null
}

function clearAnswer(){
    answer.value = null
}

async function chatGPT(){
    if(!prompt.value){
        let message = "Please input your question"
        showToast(message)
        return
    }
    spin_loading.value = true
    let payload = {}
    messages.value.push({"role":"user", "content":prompt.value})
    payload['messages'] = messages.value
    let url = 'get_suggestions_from_chatgpt'
    let response = await postRequest(url,payload,token)
    if(response.request.status == 200){
        spin_loading.value = false
        answer.value = DOMPurify.sanitize(marked.parse(response['data']['answer'], { USE_PROFILES: { html: true } }))
        messages.value = response['data']['messages']
    } else {
        let message = "failed to connect Open AI"
        showToast(message)
        spin_loading.value = false
    }
}

function addSection(){
  if(sections.value.length < 5){
    sections.value.push({
      id:number_of_section.value,
      title:null,
      order_index:number_of_section.value,
      components: [],
      collapsed: false
    })
    number_of_section.value += 1
  } else {
    let message = "More than 5 sections are not allowed"
    showToast(message)
  }
  console.log(sections.value)
}

function deleteSection(section_id){
  const index = sections.value.findIndex(item => item.id === section_id)
  //console.log(index)
  if (index !== -1) {
    sections.value.splice(index, 1)
  }
}


function deleteComponent(section, id) {
    const index = section.components.findIndex(c => c.id === id)
    if (index !== -1) {
        section.components.splice(index, 1)
    }
}

function updateComponentOrder(section) {
  section.components.forEach((component, index) => {
    component.order_index = index + 1
  })
}


async function submit(){
    if (!title.value || !content.value) {
        showToast("Title and content are required.");
        return;
    }
    let payload = {}
    payload['title'] = title.value
    payload['content'] = content.value
    spin_loading.value = true

    if(props.isEdit){
        payload['landing_page_id'] = props.landingPageId
    }

    // handling form data
    
    // Validate sections and components
    for (const section of sections.value) {
        if (!section.title || section.title.trim() === '') {
            showToast("Each section must have a title.");
            return;
        }

        if (!Array.isArray(section.components) || section.components.length === 0) {
            showToast(`Section "${section.title || section.id}" must contain at least one component.`);
            return;
        }

        // 3. Loop through each component in the section
        for (const component of section.components) {
            if (!component.label || component.label.trim() === '') {
                showToast(`A component in section "${section.title || section.id}" is missing its question label.`);
                return;
            }

            const isOptionType = ['select', 'radio', 'checkbox'].includes(component.type);

            if (isOptionType) {
                if (!Array.isArray(component.options) || component.options.length === 0) {
                    showToast(`Component "${component.label}" must have at least one option.`);
                    return;
                }

                // 4. New: Validate each option label is not empty
                const emptyOption = component.options.find(opt => !opt || opt.trim() === '');
                if (emptyOption !== undefined) {
                    showToast(`Component "${component.label}" has an option with an empty label.`);
                    return;
                }
            }
        }
    }

    payload['sections'] = sections.value
    console.log(payload['sections'])
    spin_loading.value = false
    let url = props.isEdit
    ? 'update_landing_page'
    : 'create_landing_page';

    let response = await postRequest(url,payload,token)
    if(response.request.status == 200){
        spin_loading.value = false
        router.push('/page/landing-pages');
    } else {
        let message = "failed to create / edit landing page"
        showToast(message)
        spin_loading.value = false
    }
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = message
  toast.show();
}

function normalizeSectionFromApi(s) {
  const section = {
    id: s.id ?? (Date.now() + Math.random()),
    backend_id: s.id ?? null,               // 🧷 keep original for update
    title: s.title ?? '',
    order_index: s.order_index ?? 1,
    collapsed: false,
    components: []
  }
  const comps = (s.fields ?? []).slice().sort((a,b) => (a.order_index||0)-(b.order_index||0))
  section.components = comps.map(c => normalizeComponentFromApi(c, section))
  return section
}

function normalizeComponentFromApi(c, section) {
  // keep backend id if exists (for updates)
  const id = c.id ?? (Date.now() + Math.random())
  const fieldName = c.name ?? `${c.type}_${id}`
  const isOptionType = ['select', 'radio', 'checkbox'].includes(c.type)
  // options could be strings, or objects from backend → flatten to strings
  const options = Array.isArray(c.options)
    ? c.options.map(o => (typeof o === 'string' ? o : (o?.label ?? '')))
    : (isOptionType ? [] : [])

  return {
    id,
    backend_id: c.id ?? null,              // 🧷 keep original for update
    type: c.type,
    label: c.label ?? '',
    fieldName,
    isEditing: false,                       // start closed in edit mode
    options,
    is_required: c.required,
    order_index: c.order_index ?? section.components.length + 1
  }
}


onMounted(async () => {
  checkLogin();
  if (props.isEdit && props.landingPageId) {
    let payload = {}
    payload['landing_page_id'] = props.landingPageId
    const response = await postRequest('get_landing_page_by_admin',payload,token);
    if (response['status'] = 200) {
        title.value = response.data.title;
        content.value = response.data.content;
        const apiSections = Array.isArray(response.data.sections) ? response.data.sections : []
        // normalize + sort by order_index
        sections.value = apiSections
            .slice()
            .sort((a,b) => (a.order_index||0)-(b.order_index||0))
            .map(normalizeSectionFromApi)

        // ensure correct order_index after load
        sections.value.forEach(updateComponentOrder)
        // bump counter so new sections get unique ids
        number_of_section.value = Math.max(0, ...sections.value.map(s => s.order_index)) + 1
        console.log(sections.value)
    } else {
        let message = "failed to load landing page"
        showToast(message)
    }
  }
});

</script>
<template>
    <loading v-model:active="spin_loading"
    :is-full-page="true"/>
    <div class="toasts-container">
        <div class="toast fade hide" data-autohide="false" id="toast-1">
            <div class="toast-header">
                <i class="far fa-bell text-muted me-2"></i>
                <strong class="me-auto">Alert</strong>
                <small></small>
                <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                {{notification_message}}
            </div>
        </div>
    </div>
    <card>
        <card-body class="pb-2">
            <div class="row">
                <div class="col-md-12">
                    <div class="row" style="margin-bottom:10px;">
                        <div class="flex-fill fw-bold fs-16px">Create landing page</div>
                    </div>
                </div>
            </div>
        </card-body>
        <hr>
        <card-body class="pb-2">
            <div class="row" style="margin-bottom:10px;">
                <div class="col-md-6">
                    <div class="flex-fill fw-bold fs-16px">Get help from Open AI for your content</div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <div class="row">
                        <div class="col-md-12">
                            <textarea
                            v-model="prompt"
                            class="form-control"
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="row">
                        <div class="col-md-4">
                            <button type="button" class="btn btn-yellow mb-1 me-1" @click="chatGPT">Get suggestions</button>
                        </div>
                        <div class="col-md-4">
                            <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteConversations">Clear question</button>
                        </div>
                        <div class="col-md-4">
                            <button type="button" class="btn btn-danger mb-1 me-1" @click="clearAnswer">Clear answer</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" v-if="answer">
                <div class="col-md-12" v-html="answer"></div>
            </div>
        </card-body>
        <hr>
        <card-body class="pb-2">
            <div class="row">
                <div class="col-md-12">
                    <div class="row" style="margin-bottom:10px;">
                        <div class="flex-fill fw-bold fs-16px">Title</div>
                    </div>
                    <div class="row" style="margin-bottom:10px;">
                        <div class="col-md-12">
                            <input type="text" class="form-control" placeholder="" v-model="title"/>
                        </div>
                    </div>
                </div>
                <div class="col-md-12">
                    <div class="row" style="margin-bottom:10px;">
                        <div class="flex-fill fw-bold fs-16px">Content</div>
                    </div>
                    <div class="row" style="margin-bottom:10px;">
                        <div class="col-md-12">
                            <quill-editor 
                                theme="snow" 
                                v-model:content="content"
                                contentType="html"
                                toolbar="full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </card-body>
        <hr style="margin-top:150px;">
        <card-body class="pb-2">
            <div class="row">
                <div class="col-md-12">
                    <div class="row" style="margin-bottom:10px;">
                        <div class="col-md-2">
                            <div class="row">
                                <div class="col-md-12">
                                    <button type="button" class="btn btn-green mb-1 me-1" @click="addSection">Add section</button>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-10">
                            <div class="row">
                                <div class="col-md-3">
                                    <draggable
                                        :list="formComponents"
                                        :group="{ name: 'components', pull: 'clone', put: false }"
                                        item-key="type"
                                        :clone="cloneComponent"
                                        sort="false"
                                        tag="div"                              
                                        class="d-flex"
                                        >
                                        <template #item="{ element }">
                                            <div class="bg-gray-100 p-2 rounded cursor-grab me-2">
                                            {{ element.label }}
                                            </div>
                                        </template>
                                    </draggable>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </card-body>
        <hr>
        <template v-for="section in sections" :key="section.id">
            <card-body class="pb-2">
                <div class="row">
                    <div class="col-md-12">
                        <div class="row" style="margin-bottom:10px;">
                            <div class="flex-fill fw-bold fs-16px">Section</div>
                        </div>   
                        <div class="row" style="margin-bottom:10px;">
                            <div class="col-md-12">
                                <div class="row">
                                    <div class="col-md-12">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="row">
                                                    <div class="col-md-3">
                                                        <input type="text" class="form-control" placeholder="Section title" v-model="section.title"/>
                                                    </div>
                                                    <div class="col-md-4">
                                                        <button
                                                            type="button"
                                                            class="btn btn-yellow mb-1 me-1"
                                                            @click="section.collapsed = !section.collapsed"
                                                        >
                                                            {{ section.collapsed ? 'Show components' : 'Hide components' }}
                                                        </button>
                                                    </div>
                                                    <div class="col-md-3">
                                                        <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteSection(section.id)">Delete</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row" v-if="section.collapsed == false">
                                            <draggable
                                                v-model="section.components"
                                                :group="{ name: 'components', pull: true, put: true }"
                                                :clone="(component) => cloneComponent(component, section)"
                                                item-key="id"
                                                tag="div"
                                                class="d-flex flex-column gap-3 mt-2 border p-3 rounded bg-light"
                                                @add="(event) => onComponentDropped(event, section)"
                                                @end="updateComponentOrder(section)"
                                            >
                                                <template #item="{ element,index }">
                                                    <div class="p-3 bg-white border rounded shadow-sm">
                                                       
                                                        <!-- Editable label input (shown immediately after drop) -->
                                                        <div v-if="element.isEditing">
                                                            <input
                                                            v-model="element.label"
                                                            class="form-control mb-2"
                                                            placeholder="Enter your question"
                                                            @keyup.enter="element.isEditing = false"
                                                            @blur="element.isEditing = false"
                                                            />
                                                        </div>

                                                        <!-- Display the label (click to edit again) -->
                                                        <div v-else @click="element.isEditing = true" style="cursor: pointer;">
                                                            <label class="fw-bold d-block mb-2">
                                                            {{ element.label }}
                                                            </label>
                                                        </div>

                                                        <!-- Field preview -->
                                                        <div v-if="element.type === 'text'">
                                                            <input
                                                            type="text"
                                                            v-model="formData[element.fieldName]"
                                                            class="form-control"
                                                            :placeholder="text"
                                                            />
                                                        </div>

                                                        <div v-else-if="element.type === 'textarea'">
                                                            <textarea
                                                            v-model="formData[element.fieldName]"
                                                            class="form-control"
                                                            :placeholder="element.label"
                                                            ></textarea>
                                                        </div>

                                                        <div v-else-if="element.type === 'number'">
                                                            <input
                                                            type="number"
                                                            v-model="formData[element.fieldName]"
                                                            class="form-control"
                                                            :placeholder="element.label"
                                                            />
                                                        </div>

                                                        <div v-else-if="element.type === 'date'">
                                                            <input
                                                            type="date"
                                                            v-model="formData[element.fieldName]"
                                                            class="form-control"
                                                            />
                                                        </div>

                                                        <div v-else-if="['select', 'radio', 'checkbox'].includes(element.type)">
                                                            <div v-for="(opt, i) in element.options" :key="i" class="input-group mb-1">
                                                                <input
                                                                type="text"
                                                                class="form-control"
                                                                v-model="element.options[i]"
                                                                placeholder="Option text"
                                                                />
                                                                <button class="btn btn-outline-danger" @click="element.options.splice(i, 1)">
                                                                ×
                                                                </button>
                                                            </div>
                                                            <button class="btn btn-sm btn-outline-primary" @click="element.options.push('')">
                                                                Add Option
                                                            </button>
                                                        </div>

                                                        <div class="form-check mb-2" style="margin-top:10px;">
                                                            <input
                                                                class="form-check-input"
                                                                type="checkbox"
                                                                v-model="element.is_required"
                                                                :id="`required_${element.id}`"
                                                            />
                                                            <label class="form-check-label" :for="`required_${element.id}`">
                                                                Required
                                                            </label>
                                                        </div>

                                                        <button type="button" class="btn btn-danger mb-1 me-1" @click="deleteComponent(section,element.id)" style="margin-top:10px;">delete</button>
                                                    </div>
                                                </template>
                                            </draggable>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </card-body>
            <hr>
        </template>

        <card-body class="pb-2">
            <div class="row">
                <div class="col-md-3">
                    <button type="button" class="btn btn-teal mb-1 me-1" @click="submit">Submit</button>
                </div>
            </div>
        </card-body>
    </card>

    
</template>