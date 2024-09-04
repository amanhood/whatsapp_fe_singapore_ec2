<script setup>
import { useUserSessionStore } from '@/stores/user-session';
import { ref } from 'vue'
import { getRequest,postRequest,deleteRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import { useRouter, RouterLink } from 'vue-router';
import draggable from 'vuedraggable'
import 'vue-select/dist/vue-select.css';

const router = useRouter()

let username = ref(null)
let token = ref(null)
let whatsapp_accounts = ref([])
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let flow_name = ref(null)
let screens = ref([])
let screen_id = ref(1)
let child_id = ref(1)
let hoveredScreenContent = ref(null)
let flow_id = ref(null)

let firstLevelOptions = ref(null)
let secondLevelOptions = ref(null)
let selectedFirstLevel = ref(null)
let selectedSecondLevel = ref(null)
let options = [
  {
    value:'text',
    label:'Text',
    children:[
      {value:'TextHeading',label:'Large Heading'},
      {value:'TextSubheading',label:'Small Heading'},
      {value:'TextBody',label:'Body'},
      {value:'TextCaption',label:'Caption'}
    ]
  },
  {
    value:'form',
    label:'Form',
    children:[
      {value:'text',label:'Text'},
      {value:'number',label:'Number'},
      {value:'email',label:'Email'},
      {value:'password',label:'Password'},
      {value:'passcode',label:'Passcode'},
      {value:'phone',label:'Phone'},
      {value:'textarea',label:'Text Area'}
    ]
  }
]

let textOptions = [
  {value:'TextHeading',label:'Large Heading'},
  {value:'TextSubheading',label:'Small Heading'},
  {value:'TextBody',label:'Body'},
  {value:'TextCaption',label:'Caption'}
]

firstLevelOptions = options

token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

const state = history.state
flow_id = JSON.parse(state.flow_id)
selected_waba_account = state.selected_waba_account
selected_phone_number_id = state.selected_phone_number_id

function checkType(child_type){
  if(child_type == 'TextHeading'){
    return "Large Heading"
  } else if(child_type == 'TextSubheading'){
    return "Small Heading"
  } else if(child_type == 'TextBody'){
    return "Body"
  } else if(child_type == 'TextCaption'){
    return "Caption"
  }
}

function onFirstLevelChange() {
  const selected = options.find(item => item.value === selectedFirstLevel.value);
  secondLevelOptions.value = selected ? selected.children : [];
  selectedSecondLevel.value = null
}

function onSecondLevelChange(){
  //console.log(selectedSecondLevel.value)
  const selectedScreen = selectScreenById(hoveredScreenContent.value.id);
  //console.log(selectedScreen.layout.children[0].children)
  if (selectedSecondLevel.value === 'text') {
    selectedScreen.layout.children[0].children.push({
      id: child_id.value,
      type: 'TextInput',
      required: false,
      label: null,
      name: null,
    });
  } else if (
    selectedSecondLevel.value === 'number' ||
    selectedSecondLevel.value === 'email' ||
    selectedSecondLevel.value === 'password' ||
    selectedSecondLevel.value === 'passcode' ||
    selectedSecondLevel.value === 'phone'
  ) {
    selectedScreen.layout.children[0].children.push({
      id: child_id.value,
      type: 'TextInput',
      required: false,
      label: null,
      name: null,
      'input-type': selectedSecondLevel.value
    });
  } else if (selectedSecondLevel.value === 'textarea') {
    selectedScreen.layout.children[0].children.push({
      id: child_id.value,
      type: 'TextArea',
      required: false,
      label: null,
      name: null
    });
  } else {
    selectedScreen.layout.children[0].children.push({
      id: child_id.value,
      type: selectedSecondLevel.value,
      text: null
    });
  }
  child_id.value += 1
}

function selectScreenById(screenId) {
  return screens.value.find(screen => screen.id === screenId);
}


function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

function addScreen(){
  screens.value.push(
    {
      'id':screen_id.value,
      'title':'',
      "terminal": true,
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "Form",
            "name": "form",
            "children": [
              {
                "type": "Footer",
                "label": "Continue",
                "on-click-action": {
                  "name": "complete",
                  "payload": {}
                }
              }
            ]
          }
        ]
      }
    }
  )
  screen_id.value += 1
  //console.log(screens.value)
}

function deleteScreen(screen_id){
    const index = screens.value.findIndex(item => item.id === screen_id)
    //console.log(index)
    if (index !== -1) {
      screens.value.splice(index, 1)
    }
    //console.log(buttons.value)
    hoveredScreenContent.value = null
}

function deleteItem(screen_id,child_id){
  screens.value.forEach(item => {
    if (item.id === screen_id) {
      item.layout.children[0].children = item.layout.children[0].children.filter(child => child.id !== child_id);
    }
  });
}

function onEnd(event) {
  //console.log('Order changed:', screens.value);
}


function onMouseOver(element) {
  hoveredScreenContent.value = element;

}

//function onMouseLeave() {
//  hoveredScreenContent.value = null;
//}


function closeForm() {
  // Close form logic
}
function openMenu() {
  // Open menu logic
}

checkLogin()

function getScreensData(){
  let data = {}
  data['version'] = "3.1"
  // replace id by title and delte children id
  screens.value.forEach((item, i) => {
    item.id = item.title
    removeIds(item.layout.children)
  });
  // creating routing model
  const routing = {};
  if(screens.value.length > 0){
    for (let i = 0; i < screens.value.length - 1; i++) {
        routing[screens.value[i].id] = [screens.value[i + 1].id];
    }
  }
  data['routing_model'] = routing
  data['screens'] = screens.value
  console.log(data)
}

function removeIds(obj) {
    if (Array.isArray(obj)) {
        obj.forEach(removeIds);
    } else if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty('id')) {
            delete obj.id;
        }
        Object.keys(obj).forEach(key => removeIds(obj[key]));
    }
}



</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #ccc;
  width: calc(100% + 2px); /* Adjust width to account for the container's border */
  margin-left: -1px; /* Shift left to align with the container's border */
  margin-right: -1px; /* Shift right to align with the container's border */
}

.header button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 16px;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background-color: white;
  border-top: 1px solid #ccc;
}

.continue-button {
  width: 100%;
  padding: 12px;
  background-color: #25D366;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 8px;
}

.footer p {
  font-size: 12px;
  color: #555;
}

.footer a {
  color: #007bff;
  text-decoration: none;
}

.footer a:hover {
  text-decoration: underline;
}

#margin_top_10{
  margin-bottom:10px;
  margin-top:10px;
}

#drag_item{
  padding: 10px;
  margin-bottom: 5px;
  cursor: move;
}

</style>


<template>
  <card>
    <card-body class="pb-2">
      <div class="row" v-if="selected_waba_account">
        <div class="col-xl-9">
          <div class="form-group mb-3">
            <div class="flex-fill fw-bold fs-16px">Update Flow</div>
          </div>
          <div class="form-group mb-3">
            <button type="button" class="btn btn-outline-primary mb-1 me-1" @click="getScreensData">Update</button>
          </div>

        </div>
      </div>
      <hr>
    </card-body>

    <card-body class="pb-2">
      <div class="row">
        <div class="col-xl-3" style="border:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px" id="margin_top_10">Screens</div>
          <div class="row">
            <draggable v-model="screens" @end="onEnd">
              <template #item="{ element }">
                <div class="row" :key="element.id" id="drag_item">
                  <div class="col-md-10">
                    <input type="text" class="form-control" v-model="element.title" placeholder="Title" @mouseover="onMouseOver(element)">
                  </div>
                  <div class="col-md-2">
                    <button type="button" class="btn btn-default mb-1 me-1" @click="deleteScreen(element.id)">X</button>
                  </div>
                </div>
              </template>
            </draggable>
            <div class="form-group mb-3">
              <button type="button" class="btn btn-default mb-1 me-1" @click="addScreen">+Add new</button>
            </div>
          </div>
        </div>

        <div class="col-xl-6" style="border-right:1px solid #ccc;border-top:1px solid #ccc;border-bottom:1px solid #ccc;">
          <div class="flex-fill fw-bold fs-16px" id="margin_top_10">Content</div>
          <card-body v-if="hoveredScreenContent">
            <div class="row" v-for="child in hoveredScreenContent.layout.children[0].children" style="margin-bottom:10px;">
              <div class="form-group mb-3" v-if="child.type !='Footer'">
                <label class="form-label" for="exampleFormControlInput1">Text Type</label>
                <v-select v-model="child.type" :options="textOptions" label="label"></v-select>
              </div>

              <div class="form-group mb-3" v-if="child.type !='Footer'">
                <label class="form-label" for="exampleFormControlTextarea1">{{checkType(child.type)}}</label>
                <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="child.text"></textarea>
              </div>

              <div class="form-group mb-3 d-flex justify-content-between align-items-center" v-if="child.type !='Footer'">
                <span> <!-- This can be any content you want on the left side --></span>
                <i class="fas fa-lg fa-fw me-2 fa-trash" @click="deleteItem(hoveredScreenContent.id,child.id)"></i>
              </div>
              <hr v-if="child.type !='Footer'">
            </div>
          </card-body>

          <card-body v-else>
            Please mouse hover for the screen to display content
          </card-body>


          <card-body v-if="hoveredScreenContent">
            <div class="row">
              <div class="col-md-6">
                <select class="form-select" id="exampleFormControlSelect1" v-model="selectedFirstLevel" @change="onFirstLevelChange">
                  <option v-for="item in firstLevelOptions" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
              <div class="col-md-6" v-if="secondLevelOptions && secondLevelOptions.length > 0">
                <select class="form-select" id="exampleFormControlSelect1" v-model="selectedSecondLevel" @change="onSecondLevelChange">
                  <option v-for="item in secondLevelOptions" :key="item.value" :value="item.value">{{item.label}}</option>
                </select>
              </div>
            </div>
          </card-body>
        </div>

        <div class="col-xl-3">
          <div class="container">
            <header class="header">
              <button @click="closeForm">✖</button>
              <h1>Your form</h1>
              <button @click="openMenu">⋮</button>
            </header>
            <main class="content">
              <p>Select 'Add content' to start building your form. To add new screens, select 'Add new' in the 'Screens' panel.</p>
            </main>
            <footer class="footer">
              <button class="continue-button">Continue</button>
            </footer>
          </div>
        </div>
      </div>
      <!-- END row -->
    </card-body>
  </card>
</template>
