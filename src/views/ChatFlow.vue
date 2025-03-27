<script setup>
import { ref, onMounted } from "vue";
import { VueFlow } from "@vue-flow/core";
import { Background } from "@vue-flow/background"
import { Controls } from "@vue-flow/controls"
import { MiniMap} from "@vue-flow/minimap"
import "@vue-flow/core/dist/style.css";
import "material-icons/iconfont/material-icons.css";
import ButtonNode from "./ButtonNode.vue";
import MessageNode from "./MessageNode.vue";
import { getRequest,postRequest,deleteRequest,putRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';


// Define reactive nodes and edges
const state = window.history.state


let token = ref(null)
let username = ref(null)
let selected_waba_account = ref(state.waba_id)
let selected_phone_number_id = ref(state.phone_number_id)
let selected_phone_number = ref(state.phone_number)
let existing_message = ref(null)
let parent_id = ref(null)
let isLoading = ref(false)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")

onMounted(() => {
  if(state.message){
    existing_message.value = JSON.parse(state.message)
    // assign parent id if the message from state is parent message
    if(existing_message.value.is_parent == 'yes'){
      parent_id.value = existing_message.value.id
    }
    // generating nodes and messages with edges
    if(existing_message.value){
      console.log(existing_message.value)
      nodeWithButtons(existing_message.value.id,existing_message.value.name,existing_message.value.message,existing_message.value.buttons,1)
      if(existing_message.value.is_parent == 'yes'){
        if(existing_message.value.children){
          existing_message.value.children.forEach((item, index) => {
            nodeWithButtons(item.id,item.name,item.message,item.buttons,index+2)
          });
        }
      }
    }
    // generating node to node edge for parent node
    if(existing_message.value.buttons.length > 0){
      generateEdgeNodeToNode(existing_message.value.buttons)
    }
    // generating node to node edge for children
    if(existing_message.value.children){
      existing_message.value.children.forEach(item => {
        if(item.buttons.length > 0){
          generateEdgeNodeToNode(item.buttons)
        }
      })
    }
  }
});

function generateEdgeNodeToNode(buttons){
  buttons.forEach(item => {
    if(item.button_type == 'next_flow'){
      if(item.nodes.length > 0){
        item.nodes.forEach(item => {
          edgeNodeToNode(item.source_id,item.replybutton_id,item.autoreplymessage_id)
        })
      }
    }
  });
}


const nodes = ref([])
const edges = ref([])

let button_types = [
  {value:'text',label:'Displaying text'},
  {value:'url',label:'Go to url'},
  {value:'next_flow',label:'Next flow'},
  {value:'document',label:'Document'},
  {value:'image',label:'Image'},
  {value:'video',label:'Video'}
]
let message_types = [
  {value:'text',label:'Displaying text'},
  {value:'url',label:'Go to url'},
  {value:'document',label:'Document'},
  {value:'image',label:'Image'},
  {value:'video',label:'Video'}
]
let is_button = ref("no")
let key = ref(null)
let name = ref(null)
let message = ref(null)
let message_type = ref(null)
let buttons = ref([])
let button_id = ref(1)
let button_type = ref(null)
// message only
let text_message = ref(null)
let url_header_text = ref(null)
let url_body_text = ref(null)
let url_footer_text = ref(null)
let url_button_text = ref(null)
let url = ref(null)
let notification_message = ref(null)

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

let baseX = 210; // Horizontal spacing between nodes
let baseY = 5;  // Reduced vertical spacing to keep nodes higher
let rowLimit = 1; // Number of nodes per row before starting a new row
let startX = 100; // Starting X position
let startY = 100;  // Starting Y position (higher than before)
let usedPositions = new Map(); // Keep track of occupied positions

function getUniquePosition(id, number, isMessageNode = false, parentId = null) {
  let x, y;
  if (!isMessageNode) {
    // 📌 Arrange Button Nodes in a Grid
    let row = id % rowLimit;
    let col = Math.floor(id / rowLimit);
    x = startX + row * baseX;
    y = col * number * 4;

    // Ensure we store this position
    usedPositions.set(`node-${id}`, { x, y });
  } else {
    // 📌 Place Message Nodes to the Right of Parent Button Nodes
    let parentPosition = usedPositions.get(`node-${parentId}`);
    if (!parentPosition) {
      console.warn(`Parent ID ${parentId} not found in usedPositions!`);
      parentPosition = { x: startX, y: startY }; // Fallback to default
    }
    x = parentPosition.x + number * 300; // Shift right for message node
    y = parentPosition.y - (number * 10); // Align vertically with button node

    // Prevent overlapping by checking used positions
    let attempts = 0;
    while (usedPositions.has(`${x}-${y}`) && attempts < 10) {
      y += baseY; // Move down slightly if space is occupied
      attempts++;
    }

    // Store the message node position
    usedPositions.set(`node-${id}`, { x, y });
  }

  return { x, y };
}


function addButton(){
  buttons.value.push({
    'id':button_id.value,
    'button_type':button_type.value,
    'button_title':'',
    'button_message':'',
    'url_header_text':'',
    'url_body_text':'',
    'url_footer_text':'',
    'url_button_text':'',
    'url':'',
    'file':'',
    'media_id':''
  })
  button_id.value += 1
}

function deleteButton(button_id){
    const index = buttons.value.findIndex(item => item.id === button_id)
    if (index !== -1) {
      buttons.value.splice(index, 1)
    }
    button_type.value = null
}

// Event handlers
// const onNodesChange = (changes) => {
//   console.log("Nodes changed:", changes);
// };

const onEdgesChange = (changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      console.log("Edge deleted:", change);
      var source_id = change.source.split("-")[1]
      var replybutton_id = change.sourceHandle.split("-")[1]
      var target_id = change.target.split("-")[1]
      // delete edge for node to node. 
      if(change.targetHandle == 'target-handle'){
        deleteEdgeNodeToNodeRelationship(source_id,replybutton_id,target_id)
      }
    }
  });
};

const onConnect = async (connection) => {
  edges.value.push({
    ...connection,
    id: `e${connection.source}-${connection.target}`,
  });
  let source = connection.source
  let sourceHandle = connection.sourceHandle
  let target = connection.target
  let targetHandle = connection.targetHandle
  let source_node = await getNode(source)
  let target_node = await getNode(target)
  source_node = (JSON.parse(source_node))
  target_node = (JSON.parse(target_node))
  if(source_node['reply_type'] == 'flow' && target_node['reply_type'] == 'flow'){
    let source_button_id = sourceHandle.split("-")[1]
    let source_id = source_node['id']
    let target_id = target_node['id']
    // set node to node connection at database
    CreateNodeToNodeRelationship(source_id,source_button_id,target_id)
  } 
};

async function deleteEdgeNodeToNodeRelationship(source_id,source_button_id,target_id){
  let payload = {}
  payload['button_id'] = source_button_id
  payload['target_id'] = target_id
  payload['source_id'] = source_id
  let response = await postRequest("delete_node_to_node_relationship",payload,token)
  if(response.request.status == 200){
    if(response['data']['status']){
      getParentNodeWithChildren()
    }
    
  } else {
    let response_message = "failed to delete Node to Node relationship"
    showToast(response_message)
  }
}

async function CreateNodeToNodeRelationship(source_id,source_button_id,target_id){
  let payload = {}
  payload['button_id'] = source_button_id
  payload['target_id'] = target_id
  payload['source_id'] = source_id
  let response = await postRequest("create_node_to_node_relationship",payload,token)
  if(response.request.status == 200){
    console.log(response)
    let response_message = response['data']['message']
    showToast(response_message)
    if(response['data']['success'] == true){
      edgeNodeToNode(source_id,source_button_id,target_id)
      getParentNodeWithChildren()
    }
  } else {
    let response_message = "failed to create Node to Node relationship"
    showToast(response_message)
  }
}

function edgeNodeToNode(source_id,button_id,target_id){
  let source = "message-"+source_id
  let target = "message-"+target_id
  let source_handle = "button-"+button_id+"-source"
  let edgeId = "message-"+source_id+"target-"+target+"node-to-node"

  if (edges.value.some(edge => edge.id === edgeId)) {
    console.warn("Edge already exists:", edgeId);
    return;
  }

  edges.value = [
    ...edges.value,
    {
      id: edgeId, // Unique edge ID
      source: source,         // ButtonNode ID
      sourceHandle: source_handle, // Connects to the first button's handle
      target: target,
      targetHandle: "target-handle",
      type: 'smoothstep', // Edge type
      style: {
        stroke: '#007bff', // Edge color
        strokeWidth: 2, // Thickness of the edge
        strokeDasharray: '4 2', // Creates the dotted effect
      },
      markerEnd: {
        type: 'arrow', // Arrow marker at the end
        width: 15, // Arrow width
        height: 15, // Arrow height
        color: '#007bff', // Arrow color (matches edge)
      }
    }
  ]

}

async function getNode(data){
  let payload = {}
  payload['data'] = data
  let response = await postRequest("get_node_message",payload,token)
  if(response.request.status == 200){
    return response['data']
  } else {
    let response_message = "failed to get message record"
    showToast(response_message)
  }
}

async function getParentNodeWithChildren(){
  let payload = {}
  payload['id'] = JSON.parse(state.message).id
  let response = await postRequest("get_parent_node_with_children",payload,token)
  if(response.request.status == 200){
    if(response['data']['status'] == 'success'){
      let response_message = "Nodes are fetching now"
      showToast(response_message)
      state.message = JSON.stringify(response['data']['data'])
    } else {
      let response_message = "failed to get auto reply messages"
      showToast(response_message)
    }
  } else {
    response_message = "failed to get auto reply messages"
    showToast(response_message)
  }
}


const nodeTypes = { buttonNode: ButtonNode, messageNode: MessageNode }; // Register custom node

async function createMessageWithButtons(){
  let response_message = null
  message_type.value = "flow"
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['display_phone_number'] = selected_phone_number.value
  payload['name'] = name.value
  payload['key'] = key.value
  payload['reply_type'] = message_type.value
  payload['message'] = message.value
  payload['buttons'] = buttons.value
  if(parent_id.value){
    payload['is_parent'] = "no"
    payload['parent_id'] = parent_id.value
  } else {
    payload['is_parent'] = "yes"
    payload['parent_id'] = parent_id.value
  }
  let id = null
  let response = await postRequest("create_auto_reply_message",payload,token)
  if(response.request.status == 200){
    //response_message = "created auto reply messages"
    id = response['data']['data']['id']
    name = response['data']['data']['name']
    message = response['data']['data']['message']
    buttons = response['data']['data']['buttons']
    if(!parent_id.value){
      parent_id.value = id
    } 
    //showToast(response_message)
    nodeWithButtons(id,name,message,buttons,0)
    getParentNodeWithChildren
  } else {
    response_message = "failed to create auto reply messages"
    showToast(response_message)
  }
}

function nodeWithButtons(id,name,message,buttons,node_number){
  let position = getUniquePosition(id,node_number)
  let options = []
  if(buttons.length > 0){
    buttons.forEach((button,index) => {
      if(button.button_type == 'url'){
        options.push({label:button.url_button_text,id:button.id})
        nodewithMessage(id,button,index+1)
      } else if(button.button_type == 'text'){
        options.push({label:button.title,id:button.id})
        nodewithMessage(id,button,index+1)
      } else if(button.button_type == 'next_flow'){
        options.push({label:button.title,id:button.id})
      } else if(button.button_type == 'document'){
        options.push({label:button.title,id:button.id})
        nodewithMessage(id,button,index+1)
      } else if(button.button_type == 'image'){
        options.push({label:button.title,id:button.id})
        nodewithMessage(id,button,index+1)
      } else if(button.button_type == 'video'){
        options.push({label:button.title,id:button.id})
        nodewithMessage(id,button,index+1)
      }
    });
  }
  nodes.value = [
    ...nodes.value,
    {
      id: `message-${id}`,
      type: "buttonNode",
      data: {
        title: name,
        message: message,
        options: options,
      },
      position: position,
    },
  ];
}


function nodewithMessage(id,button,message_number){
  let parent_message_id = id
  let button_id = button.id
  let title = null
  let message = null
  let button_type = null
  let sequence = button.sequence - 1
  if(button.button_type == 'text'){
    message = button.title
    button_type = "TEXT"
    edgeNodeToMessage(parent_message_id,button_id)
  } else if(button.button_type == 'url'){
    title = button.url_button_text
    message = `
          <div>
          <p>${button.url_header_text}</p>
          <p>${button.url_body_text}</p>
          <p>${button.url_footer_text}</p>
          <a href="${button.url}" target="_blank" style="color: blue; text-decoration: underline;">${button.url_button_text}</a>
        `;
    button_type = "URL"
    edgeNodeToMessage(parent_message_id,button_id)
  } else if(button.button_type == 'document'){
    button_type = "Document"
    message = button.media_id
    edgeNodeToMessage(parent_message_id,button_id)
  } else if(button.button_type == 'image'){
    button_type = "Image"
    message = button.media_id
    edgeNodeToMessage(parent_message_id,button_id)
  } else if(button.button_type == 'video'){
    button_type = "Video"
    message = button.media_id
    edgeNodeToMessage(parent_message_id,button_id)
  }
  let position = getUniquePosition(button_id, message_number, true, parent_message_id)
  nodes.value = [
    ...nodes.value,
    {
      id: `button-${button_id}`,
      type: "messageNode",
      data: {
        title: button_type,
        message: message,
      },
      position: position,
    },
  ];
}

function edgeNodeToMessage(parent_message_id,button_id){
  let source = "message-"+parent_message_id
  let target = "button-"+button_id
  let source_handle = "button-"+button_id+"-source"
  edges.value = [
    ...edges.value,
    {
      id: "message-"+parent_message_id+"target-"+target+"non-flow", // Unique edge ID
      source: source,         // ButtonNode ID
      sourceHandle: source_handle, // Connects to the first button's handle
      target: target,
      type: 'smoothstep', // Edge type
      style: {
        stroke: '#007bff', // Edge color
        strokeWidth: 2, // Thickness of the edge
        strokeDasharray: '4 2', // Creates the dotted effect
      },
      markerEnd: {
        type: 'arrow', // Arrow marker at the end
        width: 15, // Arrow width
        height: 15, // Arrow height
        color: '#007bff', // Arrow color (matches edge)
      }
    }
  ]
}

function createMessageOnly(){
  let node_message = null
  if(message_type.value == 'text'){
    node_message = text_message.value
  } else {
    node_message = url_body_text.value
  }
  let position = getUniquePosition(id)
  nodes.value = [
    ...nodes.value,
    {
      id: `button-${node_id.value}`,
      type: "messageNode",
      data: {
        title: name.value,
        message: node_message
      },
      position: position,
    },
  ];
}

function getType(button_type){
  if(button_type=='text') {
    return "Text display"
  } else if (button_type=='url'){
    return "Go to url" 
  } else if (button_type=='next_flow'){
    return "Next flow" 
  } else if (button_type=='document'){
    return "Document" 
  } else if (button_type=='video'){
    return "Video" 
  } else if (button_type=='image'){
    return "Image"
  }
}



function setIsButtonTrue(){
  is_button.value = "yes"
}

function setIsButtonFalse(){
  is_button.value = "no"
}

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

async function uploadFile(event,button_id){
  isLoading.value = true
  const button = buttons.value.find((btn) => btn.id === button_id)
  const formData = new FormData();
  formData.append("file", event.target.files[0]);
  formData.append("waba_id", selected_waba_account.value);    
  formData.append("phone_number_id", selected_phone_number_id.value);    
  let response = await formdataRequest("upload_file_to_wasabi",formData,token)
  console.log(response)
  if (response.status === 200) {
    if(response['data']['status_code'] == 200){
      let media_id = response['data']['message']
      button['media_id'] = media_id
      console.log(buttons.value)
      isLoading.value = false
      showToast("File uploaded & sent to WhatsApp successfully!");
    } else {
      isLoading.value = false
      showToast("Error uploading file!");
    }
  } else {
    isLoading.value = false
    showToast("Error uploading file!");
  }
}

checkLogin()


</script>

<style>

.flow-container {
  height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden; /* Ensure no unexpected scroll */
}

</style>

<template>
  <loading v-model:active="isLoading"
                 :can-cancel="true"
                 :on-cancel="onCancel"
                 :is-full-page="fullPage"/>
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

  <div class="modal fade" id="modalLg">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Message with flow actions</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
            <div class="row">
              <div class="col-xl-6">
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Key</label>
                  <input type="text" class="form-control" placeholder="" v-model="key" required/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Name</label>
                  <input type="text" class="form-control" placeholder="" v-model="name" required/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                  <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="message" placeholder="" required></textarea>
                </div>
                
                <div class="form-group mb-3" v-if="is_button =='yes'">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Button Types</label>
                  <v-select v-model="button_type" :options="button_types" label="label" :reduce="loc => loc.value" @update:modelValue="addButton" required></v-select>
                </div>
              </div>
            </div>
            <div class="row">
              <hr style="color:black;" v-if="is_button =='yes'">
              <div class="col-xl-12" v-for="button in buttons">
                <fragment v-if="is_button =='yes'">
                  <fragment v-if="button.button_type =='text'">
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-info">{{getType(button.button_type)}}</button>
                      </label>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.button_title"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.button_message"/>
                    </div>
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='url'">
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-pink">{{getType(button.button_type)}}</button>
                      </label>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Header</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.url_header_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Body</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.url_body_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Footer</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.url_footer_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Url</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.url"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Text displayed on button</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.url_button_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='next_flow'">
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-indigo">{{getType(button.button_type)}}</button>
                      </label>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.button_title"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.button_message"/>
                    </div>
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='document'">
                    
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-success">{{getType(button.button_type)}}</button>
                      </label>
                    </div>

                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.button_title"/>
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id)" accept="application/pdf"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='image'">
                    
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-success">{{getType(button.button_type)}}</button>
                      </label>
                    </div>

                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.button_title"/>
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id)" accept="image/*"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='video'">
                    
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-success">{{getType(button.button_type)}}</button>
                      </label>
                    </div>

                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.button_title"/>
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id)" accept="video/*"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>
                  
                  
                </fragment>
              </div>
            </div>
            <div class="row" v-if="buttons.length > 0">
                <div class="col-xl-6">
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-teal" @click="createMessageWithButtons">Create message with flow actions</button>
                  </div>
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="modalLg1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Message without flow actions</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body">
            <div class="row">
              <div class="col-xl-6">
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Key</label>
                  <input type="text" class="form-control" placeholder="" v-model="key"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Name</label>
                  <input type="text" class="form-control" placeholder="" v-model="name"/>
                </div>
                
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message Types</label>
                  <v-select v-model="message_type" :options="message_types" label="label" :reduce="loc => loc.value" @update:modelValue=""></v-select>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-xl-12">
                <fragment v-if="message_type =='text'">
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                      <button type="button" class="btn btn-info">{{getType(message_type)}}</button>
                    </label>
                  </div>
                  
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                    <input type="text" class="form-control" placeholder="" v-model="text_message"/>
                  </div>
                </fragment>
                <fragment v-if="message_type =='url'">
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                      <button type="button" class="btn btn-pink">{{getType(message_type)}}</button>
                    </label>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Header</label>
                    <input type="text" class="form-control" placeholder="" v-model="url_header_text"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Body</label>
                    <input type="text" class="form-control" placeholder="" v-model="url_body_text"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Footer</label>
                    <input type="text" class="form-control" placeholder="" v-model="url_footer_text"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Url</label>
                    <input type="text" class="form-control" placeholder="" v-model="url"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Text displayed on button</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="url_button_text"/>
                  </div>
                </fragment>
              </div>
            </div>
            <div class="row">
                <div class="col-xl-6">
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-teal" @click="createMessageOnly">Create message without flow actions</button>
                  </div>
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
          <button type="button" class="btn btn-yellow" data-bs-dismiss="modal" id="deleteCatalogModal">Close</button>
        </div>
      </div>
    </div>
  </div>
  
  <card>
      <card-body class="pb-2" style="border-bottom:1px solid #ccc;">
        <div class="row">
          <div class="col-md-6">
            <div class="row" id="marin_top_10">
              <div class="col-md-3">
                <button type="button" class="btn btn-warning me-2" data-bs-toggle="modal" data-bs-target="#modalLg" @click="setIsButtonTrue">Create message with flow actions</button>
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-danger me-2" data-bs-toggle="modal" data-bs-target="#modalLg1" @click="setIsButtonFalse">Create message only</button>
              </div>
            </div>
          </div>
        </div>
      </card-body>
      <div class="flow-container">
        <VueFlow
          :nodes="nodes"
          :edges="edges"
          :nodeTypes="nodeTypes"
          @nodesChange="onNodesChange"
          @edgesChange="onEdgesChange"
          @connect="onConnect"
        >
          <Background :gap="12"/>
          <Controls />
          <MiniMap />
        </VueFlow>
      </div>
    </card>

</template>