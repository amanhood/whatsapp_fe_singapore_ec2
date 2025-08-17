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
import ListNode from "./ListNode.vue";
import { getRequest,postRequest,deleteRequest,putRequest,formdataRequest } from '../composables/api.js'
import { Toast } from 'bootstrap';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import { useRouter, RouterLink } from 'vue-router';

const router = useRouter()
// Define reactive nodes and edges
const state = window.history.state


let token = ref(null)
let username = ref(null)
let role = ref(null)
let user_id = ref(null)
let selected_waba_account = ref(state.waba_id)
let selected_phone_number_id = ref(state.phone_number_id)
let selected_phone_number = ref(state.phone_number)
let existing_message = ref(null)
let parent_id = ref(null)
let isLoading = ref(false)
token = sessionStorage.getItem("token")
username = sessionStorage.getItem("username")
role.value = sessionStorage.getItem("role")
user_id.value = sessionStorage.getItem("id")
let is_interactive_list_existed = ref(false)
let is_autoreplymessage_existed = ref(false)
let selected_node = ref(null)
let selected_interactivelist = ref(null)
let landing_pages = ref([])
let selected_landing_page = ref(null)

function checkLogin(){
  if(!token){
    router.push('/page/login');
  } else {
    if (role.value != 'parent'){
        router.push('/page/login');
    } 
  }
}


onMounted(() => {
  if(state.message){
    existing_message.value = JSON.parse(state.message)
    // assign parent id if the message from state is parent message
    if(existing_message.value.is_parent == 'yes'){
      parent_id.value = existing_message.value.id
    }
    // generating nodes and messages with edges
    generateStoryBoard()
  }
  getLandingPages()
});

async function getLandingPages(){
    let response = await getRequest("get_landing_pages",token)
    if(response.request.status == 200){
        landing_pages.value = response['data']['landing_pages']
    } else {
        let notification_message = "System error"
        showToast(notification_message)
    }
}

function selectLandingPage(button){
    console.log(button)
    let title = getSlug(selected_landing_page.value)
    let url = "https://app.biz-api.com/page/landing-page/" + user_id.value + "/" + title
    button.url = url
}

function getSlug(title) {
  console.log(title)
  return title.replace(/\s+/g, '-');
}

function generateStoryBoard(){
  if(existing_message.value){
    edges.value = []
    if (existing_message.value && typeof existing_message.value === 'object' && 'reply_type' in existing_message.value){
      nodeWithButtons(existing_message.value.id,existing_message.value.is_parent,existing_message.value.name,existing_message.value.message,existing_message.value.buttons,1)
      if(existing_message.value.is_parent == 'yes'){
        if(existing_message.value.children){
          existing_message.value.children.forEach((item, index) => {
            nodeWithButtons(item.id,item.is_parent,item.name,item.message,item.buttons,index+2)
          });
        }
        if(existing_message.value.interactivelists){
          existing_message.value.interactivelists.forEach((item,index)=>{
            nodeWithList(item,index+3)
          })
        }
      }
      // generating node to node edge for parent node
      if(existing_message.value.buttons.length > 0){
        generateEdgeNode(existing_message.value.buttons)
      }
      // generating node to node edge for children
      if(existing_message.value.children){
        existing_message.value.children.forEach(item => {
          if(item.buttons.length > 0){
            generateEdgeNode(item.buttons)
          }
        })
      }
      is_autoreplymessage_existed.value = true
    } else {
      // it is interactive list
      nodeWithList(existing_message.value,3)
      is_interactive_list_existed.value = true
    }
  }  
}

function generateEdgeNode(buttons){
  buttons.forEach(item => {
    if(item.button_type == 'next_flow'){
      if(item.nodes.length > 0){
        item.nodes.forEach(item => {
          edgeNodeToNode(item.source_id,item.replybutton_id,item.autoreplymessage_id)
        })
      }
      if(item.lists.length > 0){
        item.lists.forEach(item => {
          edgeNodeToList(item.source_id,item.replybutton_id,item.interactivelist_id)
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
let key = ref(null)
let name = ref(null)
let is_parent = ref(null)
let message = ref(null)
let message_type = ref(null)
let buttons = ref([])
let button_id = ref(1)
let button_type = ref(null)
let notification_message = ref(null)
// interactive list
let header = ref(null)
let body = ref(null)
let footer = ref(null)
let button_text = ref(null)
let section_id = ref(1)
let row_id = ref(1)
let sections = ref([
  {
    "section_id":section_id.value,
    "title":"",
    "rows":[
      {
        "id":row_id.value,
        "title":"",
        "description":""
      }
    ]
  }
])


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
  if(buttons.value.length < 3){
    buttons.value.push({
      'id':button_id.value,
      'button_type':button_type.value,
      'title':'',
      'button_text':'',
      'url_header_text':'',
      'url_body_text':'',
      'url_footer_text':'',
      'url_button_text':'',
      'url':'',
      'file':'',
      'media_id':''
    })
    button_id.value += 1
  } else {
    let response_message = "3 buttons are maximum"
    showToast(response_message)
  }
}

function deleteButton(button_id){
    const index = buttons.value.findIndex(item => item.id === button_id)
    if (index !== -1) {
      buttons.value.splice(index, 1)
    }
    button_type.value = null
}

//Event handlers
// const onNodesChange = (changes) => {
//   console.log("Nodes changed:", changes);
// };

const onEdgesChange = (changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      //console.log("Edge deleted:", change);
      var source_id = change.source.split("-")[1]
      var replybutton_id = change.sourceHandle.split("-")[1]
      var target = change.target.split("-")
      // delete edge for node to node. 
      if(target[0] == 'message'){
        if(change.targetHandle == 'target-handle'){
          deleteEdgeNodeToNodeRelationship(source_id,replybutton_id,target[1])
        }
      } else {
        if(change.targetHandle == 'target-handle'){
          deleteEdgeNodeToListRelationship(source_id,replybutton_id,target[1])
        }
      }
    }
  });
};

const onConnect = async (connection) => {
  console.log(connection)
  let source = connection.source
  let target = connection.target
  let source_button_id = null
  let target_button_id = null
  let source_interactivelist_id = null
  let target_interactivelist_id = null
  let source_response = null
  let target_response = null

  if(connection.source.split('-')[0] == 'list'){
    source_interactivelist_id = connection.source.split("-")[1]
    source_response = await checkEdgesLists(source_interactivelist_id)
    // check target is list or node, and not a url / text
    if (connection.target.split('-')[0] == 'message'){
      target_button_id = connection.targetHandle.split("-")[1]
      target_response = await checkEdges(target_button_id)
    } else {
      // list can not be linked with each other, so must return 400
      target_response = {}
      target_response['data'] = {}
      target_response['data']['status'] = 400
      target_response['data']['message'] = "Interactive Lists can not be linked with each other"
    }
    // connecting list with node
    if(source_response['data']['status'] == 200 && target_response['data']['status'] == 200){
      edges.value.push({
        ...connection,
        id: `e${connection.source}-${connection.target}`,
      });
      let interactivelist = JSON.parse(await getInteractiveList(source_interactivelist_id))
      let interactivelist_id = interactivelist['id']
      let node = JSON.parse(await getNode(target))
      let node_id = node['id']
      CreateNodetoListRelationship(node_id,target_button_id,interactivelist_id)
    } else {
      let response_message = null
      if (source_response['data']['status'] == 400){
        response_message = source_response['data']['message']
      } else if(target_response['data']['status'] == 400){
        response_message = target_response['data']['message']
      }
      showToast(response_message)
    }
  } else if (connection.source.split('-')[0] == 'message'){
    source_button_id = connection.sourceHandle.split("-")[1]
    source_response = await checkEdges(source_button_id)
    // check target is list or node
    if (connection.target.split('-')[0] == 'message'){ // node
      target_button_id = connection.targetHandle.split("-")[1]
      target_response = await checkEdges(target_button_id)
      let source_node = JSON.parse(await getNode(source))
      let target_node = JSON.parse(await getNode(target))
      let source_id = source_node['id']
      let target_id = target_node['id']
      if(source_response['data']['status'] == 200 && target_response['data']['status'] == 200){
        edges.value.push({
          ...connection,
          id: `e${connection.source}-${connection.target}`,
        });
        let source_button = await getButton(source_button_id)
        let target_button = await getButton(target_button_id)
        if (source_button.button_type != 'next_flow' && target_button.button_type != 'next_flow'){
          let response_message = "Buttons can not be linked each other"
          showToast(response_message)
        } else if (source_button.button_type != 'next_flow'){
          let response_message = "You should use 'next flow' button to link other message or list"
          showToast(response_message)
        } else {
          // set node to node connection at database
          CreateNodeToNodeRelationship(source_id,source_button_id,target_id)
        }
      } else {
        let response_message = null
        if (source_response['data']['status'] == 400){
          response_message = source_response['data']['message']
        } else if(target_response['data']['status'] == 400){
          response_message = target_response['data']['message']
        }
        showToast(response_message)
      }
    } else if(connection.target.split('-')[0] == 'list') { // list
      target_interactivelist_id = connection.target.split("-")[1]
      target_response = await checkEdgesLists(target_interactivelist_id)
      if(source_response['data']['status'] == 200 && target_response['data']['status'] == 200){
        edges.value.push({
          ...connection,
          id: `e${connection.source}-${connection.target}`,
        });
        let interactivelist = JSON.parse(await getInteractiveList(target_interactivelist_id))
        let interactivelist_id = interactivelist['id']
        let node = JSON.parse(await getNode(source))
        let node_id = node['id']
        CreateNodetoListRelationship(node_id,source_button_id,interactivelist_id)
      } else {
        let response_message = null
        if (source_response['data']['status'] == 400){
          response_message = source_response['data']['message']
        } else if(target_response['data']['status'] == 400){
          response_message = target_response['data']['message']
        }
        showToast(response_message)
      }
    } else { // it is url / text
      let response_message = "Node can not link to Text / Url Directly"
      showToast(response_message)
    }
  }
};

async function checkEdges(button_id){
  let payload = {}
  payload['button_id'] = button_id
  let response = await postRequest("check_edges",payload,token)
  if(response.request.status == 200){
    return response
  } else {
    let response_message = "failed to check edges"
    showToast(response_message)
  }
}

async function checkEdgesLists(target_interactivelist_id){
  let payload = {}
  payload['interactivelist_id'] = target_interactivelist_id
  let response = await postRequest("check_edges_list",payload,token)
  if(response.request.status == 200){
    return response
  } else {
    let response_message = "failed to check edges"
    showToast(response_message)
  }
}


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

async function deleteEdgeNodeToListRelationship(source_id,source_button_id,target_id){
  let payload = {}
  payload['button_id'] = source_button_id
  payload['interactivelist_id'] = target_id
  payload['source_id'] = source_id
  let response = await postRequest("delete_node_to_list_relationship",payload,token)
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

async function CreateNodetoListRelationship(source_id,source_button_id,target_id){
  let payload = {}
  payload['button_id'] = source_button_id
  payload['target_id'] = target_id
  payload['source_id'] = source_id
  let response = await postRequest("create_node_to_list_relationship",payload,token)
  if(response.request.status == 200){
    let response_message = response['data']['message']
    showToast(response_message)
    if(response['data']['success'] == true){
      edgeNodeToList(source_id,source_button_id,target_id)
      getParentNodeWithChildren()
    }
  } else {
    let response_message = "failed to create Node to Node relationship"
    showToast(response_message)
  }
}

function edgeNodeToList(source_id,button_id,target_id){
  let source = "message-"+source_id
  let target = "list-"+target_id
  let source_handle = "button-"+button_id+"-source"
  let target_handle = "target-handle"
  let edgeId = "node-"+source_id+"-target-"+target+"-node-to-list"
  createEdge(edgeId,source,source_handle,target,target_handle)
}

function edgeNodeToNode(source_id,button_id,target_id){
  let source = "message-"+source_id
  let target = "message-"+target_id
  let source_handle = "button-"+button_id+"-source"
  let target_handle = "target-handle"
  let edgeId = "message-"+source_id+"-target-"+target+"-node-to-node"
  createEdge(edgeId,source,source_handle,target,target_handle)
}

function createEdge(edgeId,source,source_handle,target,target_handle){
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
      targetHandle: target_handle,
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

async function getButton(data){
  let payload = {}
  payload['button_id'] = data
  let response = await postRequest("get_button",payload,token)
  if(response.request.status == 200){
    return response['data']
  } else {
    let response_message = "failed to get message record"
    showToast(response_message)
  }
}

async function getInteractiveList(data){
  let payload = {}
  payload['data'] = data
  let response = await postRequest("get_inetractive_list",payload,token)
  if(response.request.status == 200){
    return response['data']
  } else {
    let response_message = "failed to get interactive list"
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
      existing_message.value = response['data']['data']
      generateStoryBoard()
    } else {
      let response_message = "failed to get auto reply messages"
      showToast(response_message)
    }
  } else {
    response_message = "failed to get auto reply messages"
    showToast(response_message)
  }
}


const nodeTypes = { buttonNode: ButtonNode, messageNode: MessageNode, listNode:ListNode }; // Register custom node

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
  if(response['data']['status'] == "success"){
    //response_message = "created auto reply messages"
    id = response['data']['data']['id']
    name = response['data']['data']['name']
    is_parent = response['data']['data']['is_parent']
    message = response['data']['data']['message']
    buttons = response['data']['data']['buttons']
    if(!parent_id.value){
      parent_id.value = id
    } 
    //showToast(response_message)
    nodeWithButtons(id,is_parent,name,message,buttons,0)
    getParentNodeWithChildren
  } else {
    response_message = response['data']['data']
    showToast(response_message)
  }
}

function nodeWithButtons(id,is_parent,name,message,buttons,node_number){
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
        id:id,
        title: name,
        is_parent:is_parent,
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

function nodeWithList(item,node_number){
  let position = getUniquePosition(item.id,node_number)
  let options = []
  if(item.sections.length > 0){
    item.sections.forEach((section,index) => {
      options.push({title:section.title,id:section.id,rows:section.rows})
    });
  }
  nodes.value = [
    ...nodes.value,
    {
      id: `list-${item.id}`,
      type: "listNode",
      data: {
        id:item.id,
        title: "Interactive List",
        header:item.header,
        body:item.body,
        footer:item.footer,
        is_parent:item.is_parent,
        button_text:item.button_text,
        sections: options,
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

function showToast(response_message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  notification_message.value = response_message
  toast.show();
}

async function uploadFile(event,button_id,type){
  isLoading.value = true
  let button = null 
  if(type=='create'){
    button = buttons.value.find((btn) => btn.id === button_id)
  } else if(type=="change") {
    button = selected_node.value.buttons.find((btn) => btn.id === button_id)
    console.log(button)
  }
  const formData = new FormData();
  formData.append("file", event.target.files[0]);
  formData.append("waba_id", selected_waba_account.value);    
  formData.append("phone_number_id", selected_phone_number_id.value);    
  let response = await formdataRequest("upload_file_to_wasabi",formData,token)
  if (response.status === 200) {
    if(response['data']['status_code'] == 200){
      let media_id = response['data']['message']
      button['media_id'] = media_id
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

function addSection(){
  section_id.value += 1
  row_id.value += 1
  sections.value.push({
    "section_id":section_id.value,
    "title":"",
    "rows":[
      {
        "id":row_id.value,
        "title":"",
        "description":""
      }
    ]
  })
}

function deleteSection(selected_section_id){
  if(sections.value.length > 1){
    const index = sections.value.findIndex(item => item.section_id === selected_section_id)
    if (index !== -1) {
      sections.value.splice(index, 1)
    }
  } else {
    showToast("Interactive list message must contain one section at least");
  }
}

function addRow(selected_section_id){
  var section = sections.value.find(section => section.section_id === selected_section_id)
  if (section.rows.length < 11){
    row_id.value += 1
    section.rows.push({
        "id":row_id.value,
        "title":"",
        "description":""
    })
  } else {
    showToast("Maximum 10 rows is allowed");
  }
}

function deleteRow(section_id,row_id){
  const section = sections.value.find(s => s.section_id === section_id);
  if (!section) {
    showToast("Section can not be found");
  }
  if (section.rows.length <= 1) {
    showToast("There is only one row at section, it can not be deleted");
  } else {
    section.rows = section.rows.filter(row => row.id !== row_id);
  }
}

async function createInteractiveList(){
  let payload = {}
  payload['waba_id'] = selected_waba_account.value
  payload['phone_number_id'] = selected_phone_number_id.value
  payload['display_phone_number'] = selected_phone_number.value
  payload['key'] = key.value
  payload['header'] = header.value
  payload['body'] = body.value
  payload['footer'] = footer.value
  payload['button_text'] = button_text.value
  payload['sections'] = sections.value
  if(parent_id.value){
    payload['is_parent'] = "no"
    payload['parent_id'] = parent_id.value
  } else {
    payload['is_parent'] = "yes"
    payload['parent_id'] = parent_id.value
  }
  let response = await postRequest("create_interactive_list",payload,token)
  if(response['data']['status'] == "success"){
    let response_message = "Interactive List is created"
    showToast(response_message)
    nodeWithList(response['data']['data'],4)
    getParentNodeWithChildren

  } else {
    let response_message = response['data']['message']
    showToast(response_message)
  }
}

function generate_random_number(){
  const randomSixDigit = Math.floor(100000 + Math.random() * 900000); // Generates 6-digit number
  const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Format: YYYYMMDD
  const result = `${randomSixDigit}${currentDate}`;
  return result
}

async function EditNode(data){
  selected_node.value = JSON.parse(await getNode("message-"+data['id']))
}

function editButton(){
  if(selected_node.value.buttons.length < 3){
    const random_generated_id = generate_random_number()
    selected_node.value.buttons.push({
        'id':random_generated_id,
        'button_type':button_type.value,
        'url_header_text':'',
        'url_body_text':'',
        'url_footer_text':'',
        'url_button_text':'',
        'url':'',
        'file':'',
        'media_id':'',
        'title':'',
        'button_text':''
      })
  } else {
    let response_message = "3 buttons are maximum"
    showToast(response_message)
  }
}

function deleteExistedButton(button_id){
  if(selected_node.value.buttons.length > 1){
    const index = selected_node.value.buttons.findIndex(item => item.id === button_id)
    if (index !== -1) {
      selected_node.value.buttons.splice(index, 1)
    }
  } else {
    let response_message = "Node must contain 1 button at least"
    showToast(response_message)
  }
}

async function editNodeWithButtons(){
  let payload = selected_node.value
  let response = await postRequest("update_autoreplymessage",payload,token)
  if(response['data']['status'] == 200){
    let response_message = response['data']['message']
    showToast(response_message)
    getParentNodeWithChildren()
  } else {
    let response_message = response['data']['message']
    showToast(response_message)
  }
}

function EditList(data){
  selected_interactivelist.value = data
}

function deleteExistingRow(section_id,row_id){
  const section = selected_interactivelist.value.sections.find(s => s.id === section_id);
  if (!section) {
    showToast("Section can not be found");
  }
  if (section.rows.length <= 1) {
    showToast("There is only one row at section, it can not be deleted");
  } else {
    section.rows = section.rows.filter(row => row.id !== row_id);
  }
}

function addExistingRow(section_id){
  var section = selected_interactivelist.value.sections.find(section => section.id === section_id)
  const random_generated_id = generate_random_number()
  if (section.rows.length < 11){
    section.rows.push({
        "id":random_generated_id,
        "title":"",
        "description":""
    })
  } else {
    showToast("Maximum 10 rows is allowed");
  }
}

function deleteExistingSection(section_id){
  if(selected_interactivelist.value.sections.length > 1){
    const index = selected_interactivelist.value.sections.findIndex(item => item.id === section_id)
    if (index !== -1) {
      selected_interactivelist.value.sections.splice(index, 1)
    }
  } else {
    showToast("Interactive list message must contain one section at least");
  }
}

function addExistngSection(){
  const random_generated_id = generate_random_number()
  selected_interactivelist.value.sections.push({
    "id":random_generated_id,
    "title":"",
    "rows":[
      {
        "id":random_generated_id,
        "title":"",
        "description":""
      }
    ]
  })
}

async function editInteractiveList(){
  let payload = selected_interactivelist.value
  let response = await postRequest("update_interactivelist",payload,token)
  if(response['data']['status'] == 200){
    let response_message = response['data']['message']
    showToast(response_message)
    getParentNodeWithChildren()
  } else {
    let response_message = response['data']['message']
    showToast(response_message)
  }
}

async function handleDeleteNode(data){
  let payload = data
  let response = await postRequest("delete_autoreplymessage",payload,token)
  if(response['data']['status'] == 200){
    let response_message = response['data']['message']
    showToast(response_message)
    getParentNodeWithChildren()
  } else {
    let response_message = response['data']['message']
    showToast(response_message)
  }
}

async function handleDeleteList(data){
  let payload = data
  let response = await postRequest("delete_interactivelist",payload,token)
  if(response['data']['status'] == 200){
    let response_message = response['data']['message']
    showToast(response_message)
    getParentNodeWithChildren()
  } else {
    let response_message = response['data']['message']
    showToast(response_message)
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

.toasts-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999; /* make this higher than modals/popups */
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

  <div class="modal fade" id="modalLg4">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Interactive List</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body" v-if="selected_interactivelist">
            <div class="row">
              <div class="col-xl-6">
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">header</label>
                  <input type="text" class="form-control" placeholder="" v-model="selected_interactivelist.header"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">body</label>
                  <input type="text" class="form-control" placeholder="" v-model="selected_interactivelist.body"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">footer</label>
                  <input type="text" class="form-control" placeholder="" v-model="selected_interactivelist.footer"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Text displayed on button</label>
                  <input type="text" class="form-control" placeholder="" maxlength="20" v-model="selected_interactivelist.button_text"/>
                </div>
                <div class="form-group mb-3">
                  <button type="button" class="btn btn-teal me-2" @click="addExistngSection()">Add section</button>
                </div>
              </div>
            </div>
            <div class="row">
              <hr style="color:black;">
              <div class="col-xl-12" v-for="section in selected_interactivelist.sections">
                
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;"><b>Section Title</b></label>
                  <input type="text" class="form-control" placeholder="" maxlength="20" v-model="section.title"/>
                </div>

                <div class="form-group mb-3">
                  <button type="button" class="btn btn-lime me-2" @click="addExistingRow(section.id)">Add Row</button>
                </div>
               
                <fragment v-for="row in section.rows">
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Row Title</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="row.title"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Row Description</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="row.description"/>
                  </div>
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-danger" @click="deleteExistingRow(section.id,row.id)">Delete Row</button>
                  </div>
                  <hr style="color:#90ca4b;">
                </fragment>
                <div class="form-group mb-3">
                  <button type="button" class="btn btn-danger" @click="deleteExistingSection(section.id)">Delete Section</button>
                </div>
                <hr style="color:black;">
              </div>
            </div>
            
            <div class="row" style="margin-top:20px;">
                <div class="col-xl-6">
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-teal" @click="editInteractiveList">Edit</button>
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

  <div class="modal fade" id="modalLg3">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Edit Node</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>

        <div class="modal-body" v-if="selected_node">
            <div class="row">
              <div class="col-xl-6">
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Key</label>
                  <input type="text" class="form-control" placeholder="" v-model="selected_node.key" required/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Name</label>
                  <input type="text" class="form-control" placeholder="" v-model="selected_node.name" required/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                  <textarea class="form-control" id="exampleFormControlTextarea1" rows="3" v-model="selected_node.message" placeholder="" required></textarea>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Button Types</label>
                  <v-select v-model="button_type" :options="button_types" label="label" :reduce="loc => loc.value" @update:modelValue="editButton" required></v-select>
                </div>
              </div>
            </div>
              <div class="row">
                <hr style="color:black;">
                <div class="col-xl-12" v-for="button in selected_node.buttons">
                  <fragment v-if="button.button_type =='text'">
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-info">{{getType(button.button_type)}}</button>
                      </label>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.button_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>

                  <fragment v-if="button.button_type =='url'">

                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                        <button type="button" class="btn btn-pink">{{getType(button.button_type)}}</button>
                      </label>
                    </div>

                    <div class="form-group mb-3" v-if="landing_pages.length > 0">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Select Landing Page</label>
                      <v-select v-model="selected_landing_page" :options="landing_pages" label="title" :reduce="loc => loc.title" @update:modelValue="selectLandingPage(button)"></v-select>
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
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
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
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                      <input type="text" class="form-control" placeholder="" v-model="button.button_text"/>
                    </div>
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
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
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                    </div>

                    <div class="form-group mb-3" v-if="button.media_id">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Media</label>
                      {{button.media_id}}
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'change')" accept="application/pdf"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
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
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                    </div>

                    <div class="form-group mb-3" v-if="button.media_id">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Media</label>
                      {{button.media_id}}
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'change')" accept="image/*"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
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
                      <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                    </div>

                    <div class="form-group mb-3" v-if="button.media_id">
                      <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Media</label>
                      {{button.media_id}}
                    </div>

                    <div class="form-group mb-3">
                      <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'change')" accept="video/*"/>
                    </div>
                    
                    
                    <div class="form-group mb-3">
                      <button type="button" class="btn btn-danger" @click="deleteExistedButton(button.id)">Delete</button>
                    </div>
                    <hr style="color:#e6180d;">
                  </fragment>
                </div>
              </div>
              <div class="row">
                <div class="col-xl-6">
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-teal" @click="editNodeWithButtons">Edit</button>
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
                
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Button Types</label>
                  <v-select v-model="button_type" :options="button_types" label="label" :reduce="loc => loc.value" @update:modelValue="addButton" required></v-select>
                </div>
              </div>
            </div>
            <div class="row">
              <hr style="color:black;">
              <div class="col-xl-12" v-for="button in buttons">
                <fragment v-if="button.button_type =='text'">
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">
                      <button type="button" class="btn btn-info">{{getType(button.button_type)}}</button>
                    </label>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Title</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                    <input type="text" class="form-control" placeholder="" v-model="button.button_text"/>
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

                  <div class="form-group mb-3" v-if="landing_pages.length > 0">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Select Landing Page</label>
                    <v-select v-model="selected_landing_page" :options="landing_pages" label="title" :reduce="loc => loc.title" @update:modelValue="selectLandingPage(button)"></v-select>
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
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Message</label>
                    <input type="text" class="form-control" placeholder="" v-model="button.button_text"/>
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
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                  </div>

                  <div class="form-group mb-3">
                    <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'create')" accept="application/pdf"/>
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
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                  </div>

                  <div class="form-group mb-3">
                    <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'create')" accept="image/*"/>
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
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button.title"/>
                  </div>

                  <div class="form-group mb-3">
                    <input type="file" class="form-control" id="defaultFile" @change="uploadFile($event,button.id,'create')" accept="video/*"/>
                  </div>
                  
                  
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-danger" @click="deleteButton(button.id)">Delete</button>
                  </div>
                  <hr style="color:#e6180d;">
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
          <h5 class="modal-title">Interactive List Message</h5>
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
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">header</label>
                  <input type="text" class="form-control" placeholder="" v-model="header"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">body</label>
                  <input type="text" class="form-control" placeholder="" v-model="body"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">footer</label>
                  <input type="text" class="form-control" placeholder="" v-model="footer"/>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Text displayed on button</label>
                  <input type="text" class="form-control" placeholder="" maxlength="20" v-model="button_text"/>
                </div>
                <div class="form-group mb-3">
                  <button type="button" class="btn btn-teal me-2" @click="addSection()">Add section</button>
                </div>
              </div>
            </div>
            <div class="row">
              <hr style="color:black;">
              <div class="col-xl-12" v-for="section in sections">
                
                <div class="form-group mb-3">
                  <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;"><b>Section Title</b></label>
                  <input type="text" class="form-control" placeholder="" maxlength="20" v-model="section.title"/>
                </div>

                <div class="form-group mb-3">
                  <button type="button" class="btn btn-lime me-2" @click="addRow(section.section_id)">Add Row</button>
                </div>
               
                <fragment v-for="row in section.rows">
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Row Title</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="row.title"/>
                  </div>
                  <div class="form-group mb-3">
                    <label class="form-label" for="exampleFormControlSelect1" style="font-weight:normal;">Row Description</label>
                    <input type="text" class="form-control" placeholder="" maxlength="20" v-model="row.description"/>
                  </div>
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-danger" @click="deleteRow(section.section_id,row.id)">Delete Row</button>
                  </div>
                  <hr style="color:#90ca4b;">
                </fragment>
                <div class="form-group mb-3">
                  <button type="button" class="btn btn-danger" @click="deleteSection(section.section_id)">Delete Section</button>
                </div>
                <hr style="color:black;">
              </div>
            </div>
            
            <div class="row" style="margin-top:20px;">
                <div class="col-xl-6">
                  <div class="form-group mb-3">
                    <button type="button" class="btn btn-teal" @click="createInteractiveList">Create Interactive List</button>
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
      <card-body class="pb-2" style="border-bottom:1px solid #ccc;" v-if='is_interactive_list_existed == false'>
        <div class="row">
          <div class="col-md-6">
            <div class="row" id="marin_top_10">
              <div class="col-md-3">
                <button type="button" class="btn btn-warning me-2" data-bs-toggle="modal" data-bs-target="#modalLg">Create message with flow actions</button>
              </div>
              <div class="col-md-3">
                <button type="button" class="btn btn-secondary me-2" data-bs-toggle="modal" data-bs-target="#modalLg1">Create interactive list message</button>
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
          <template #node-buttonNode="{ id, data }">
            <ButtonNode
              :data="data"
              @open-edit-node="EditNode"
              @delete-node="handleDeleteNode"
            />
          </template>

          <template #node-listNode="{ id, data }">
            <ListNode
              :data="data"
              @open-edit-list="EditList"
              @delete-list="handleDeleteList"
            />
          </template>

        </VueFlow>
      </div>
    </card>

</template>