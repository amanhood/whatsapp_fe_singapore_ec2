<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, } from 'vue'
import { useAppOptionStore } from '@/stores/app-option';
import { useRouter, RouterLink } from 'vue-router';
import { createPopup } from '@picmo/popup-picker';
import { getRequest,postRequest } from '../composables/api.js'
import 'vue-select/dist/vue-select.css';
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import { fileProcess } from '../composables/file_process.js'
import 'vue-select/dist/vue-select.css';
import 'vue-loading-overlay/dist/css/index.css';
import { Toast } from 'bootstrap';
import { Camera, Video,File, Dock , X, Check, CircleUserRound, List, CircleArrowRight } from 'lucide-vue-next'

const appOption = useAppOptionStore();
let username = ref(null)
let token = ref(null)
let role = ref(null)
token = sessionStorage.getItem("token")
username.value = sessionStorage.getItem("username")
role = sessionStorage.getItem("role")
let whatsapp_accounts = ref([])
let select_account = ref(null)
let selected_waba_account = ref(null)
let selected_phone_number_id = ref(null)
let notification_message = ref(null)
let contacts_list = ref([])
let spin_loading = ref(false)
let scrollWrapperRef = ref(null)
const page = ref(0)
const limit = 20
const hasMore = ref(true)
let selected_customer = ref(null)
let conversations = ref([])
const conversation_page = ref(0)
const conversation_limit = 13
const hasConversationsMore = ref(true)
let scrollMessageUpRef = ref(null)
const visibleSections = ref({})
let text_message = ref(null)
const socketMap = new Map()
const droppedImage = ref(null);         // base64 string
const droppedImagePreview = ref(null);
let uploaded_file = ref({})
const reloadingContacts = ref(false)
const reloadingConversations = ref(false)
let remark_categories = ref([])
let select_remark_category = ref(null)
let remark = ref(null)
let customer_remarks = ref([])
let selected_phone_number = ref(null)
const replyToMessage = ref(null)


async function checkWaba(){
    if(role == 'parent'){
        let response = await postRequest("check_waba",null,token)
        if(response.request.status == 200){
            whatsapp_accounts.value = response['data']['whatsapp_accounts']
        } else {
            notification_message = "Failed to get whatsapp accounts"
            showToast(notification_message)
        }
    } else {
        // get waba accounts by  child account
        let response = await postRequest("check_waba_child_account",null,token)
        if(response.request.status == 200){
            whatsapp_accounts.value = response['data']['whatsapp_accounts']
        } else {
            notification_message.value = "Failed to get whatsapp accounts"
            showToast(notification_message.value)
        }
    }
}

function selectAccount(){
    selected_phone_number_id.value = select_account.value.phone_number_id
    selected_waba_account.value = select_account.value.waba_id
    getContactList()
}

async function getContactList(){
    spin_loading.value = true
    const offset = page.value * limit
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    payload['limit'] = limit
    payload['offset'] = offset
    let response = await postRequest("get_contact_lists",payload,token)
    if(response.request.status == 200){
        if (response?.data?.length) {
            contacts_list.value.push(...response.data)
            page.value += 1
            connectToSockets()
        } else {
            hasMore.value = false
        }
    } else {
        notification_message = "Failed to get contact list"
        showToast(notification_message)
    }
    spin_loading.value = false
}

function connectToSockets() {
    for (const contact of contacts_list.value) {
        const recipient_id = contact.direction === 'in' ? contact.from_number : contact.to_number
        const phone_number_id = selected_phone_number_id.value
        const groupKey = `${phone_number_id}_${recipient_id}`

        if (socketMap.has(groupKey)) continue // Already connected
        const ws = new WebSocket(`wss://biz-api.com/ws/notifications/${phone_number_id}/${recipient_id}/`)
        ws.onopen = () => {
            console.log(`✅ Connected to WS for ${groupKey}`)
        }
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            console.log(`📥 WS message for ${groupKey}:`, data)
            const msg = data.message
            const selected = selected_customer.value
            
            const isActiveChat =
            selected &&
            selected_phone_number_id.value === msg.phone_number_id &&
            (selected.from_number === msg.recipient_id || selected.to_number === msg.recipient_id)
            if (isActiveChat) {
                conversations.value = []  // Clear and reload
                conversation_page.value = 0
                debounceReloadConversations(selected)
            }

            // Always refresh contact list for preview updates (like last message)
            page.value = 0
            contacts_list.value = []
            hasMore.value = true
            debounceReloadContacts()
        }
        ws.onerror = (err) => {
            console.error(`❌ WebSocket error (${groupKey}):`, err)
        }
        ws.onclose = () => {
            console.warn(`🔌 WebSocket closed for ${groupKey}`)
            socketMap.delete(groupKey)
            setTimeout(() => connectToSockets(), 3000)
        }
        socketMap.set(groupKey, ws)
    }
}

async function getConversations(contact){
    spin_loading.value = true
    const offset = conversation_limit * conversation_page.value
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    payload['limit'] = conversation_limit
    payload['offset'] = offset
    if(contact.direction == 'in'){
        payload['phone_number'] = contact.from_number
    } else if (contact.direction == 'out'){
        payload['phone_number'] = contact.to_number
    }
    
    let response = await postRequest("get_conversations",payload,token)
    if(response.request.status == 200){
        if (response?.data?.length) {
            conversations.value.push(...response.data)
            conversations.value = conversations.value.sort((a, b) => new Date(a.last_time) - new Date(b.last_time));
            conversation_page.value += 1
        } else {
            hasConversationsMore.value = false
        }
    } else {
        notification_message = "Failed to get conversations"
        showToast(notification_message)
    }
    spin_loading.value = false
}

function onContactClick(contact){
    conversations.value = []
    conversation_page.value = 0
    getConversations(contact)
    selected_customer.value = contact
    if(selected_customer.value.direction == 'in'){
        selected_phone_number.value = selected_customer.value.from_number
    } else if (selected_customer.value.direction == 'out'){
        selected_phone_number.value = selected_customer.value.to_number
    }
    selected_phone_number
    debounceReloadContacts()
    getRemarkCategories()
    getRemarks()
}

function formatDate(delivery_datetime){
    const date = new Date(delivery_datetime);
    date.setHours(date.getHours() - 8);
    const now = new Date();
    const inputMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.floor((nowMidnight - inputMidnight) / (1000 * 60 * 60 * 24));
    if (diffInDays === 0) {
        return date.toTimeString().slice(0, 5); // HH:mm
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays === 2) {
        return '2 days ago';
    } else {
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
    }
}

function messageFormatDate(delivery_datetime){
    if (!delivery_datetime) return '';
    const date = new Date(delivery_datetime);
    date.setHours(date.getHours() - 8); // Convert from UTC to HK time
    const now = new Date();
    // Strip time part to compare date only
    const inputMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.floor((nowMidnight - inputMidnight) / (1000 * 60 * 60 * 24));
    const timeStr = date.toTimeString().slice(0, 5); // HH:mm
    if (diffInDays === 0) {
        return timeStr;
    } else if (diffInDays === 1) {
        return `Yesterday ${timeStr}`;
    } else if (diffInDays === 2) {
        return `2 days ago ${timeStr}`;
    } else {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${timeStr}`;
    }
}

function remarkFormatDate(delivery_datetime){
    if (!delivery_datetime) return '';
    const date = new Date(delivery_datetime);
    //date.setHours(date.getHours() - 8); // Convert from UTC to HK time
    const now = new Date();
    // Strip time part to compare date only
    const inputMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffInDays = Math.floor((nowMidnight - inputMidnight) / (1000 * 60 * 60 * 24));
    const timeStr = date.toTimeString().slice(0, 5); // HH:mm
    if (diffInDays === 0) {
        return timeStr;
    } else if (diffInDays === 1) {
        return `Yesterday ${timeStr}`;
    } else if (diffInDays === 2) {
        return `2 days ago ${timeStr}`;
    } else {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${timeStr}`;
    }
}

const handleScroll = (e) => {
  const el = e.target
  const bottomReached = el.scrollTop + el.clientHeight >= el.scrollHeight - 10
  if (bottomReached && !spin_loading.value && hasMore.value) {
    getContactList()
  }
}

const handleMessageScroll = (e) => {
  const el = e.target
  if (el.scrollTop == 0 && !spin_loading.value && hasConversationsMore.value) {
    getConversations(selected_customer.value)
  }  
}

function showToast(message) {
  //event.preventDefault();
  var toast = new Toast(document.getElementById('toast-1'));
  toast.show();
}

function checkLogin(){
  if(!token){
    router.push('/page/login');
  }
}

const toggleSection = (index) => {
  console.log(index)
  visibleSections.value[index] = !visibleSections.value[index]
  console.log(visibleSections.value)
}

function getFileExtension(url) {
  const pathname = new URL(url).pathname; // Get only the path part
  const lastSegment = pathname.split('/').pop(); // Get file name
  const ext = lastSegment.split('.').pop().toLowerCase(); // Get extension
  return ext;
}

async function sendMessage(){
    console.log(username.value)
    if(text_message.value){
        uploaded_file.value = {}
        spin_loading.value = true
        let payload = {}
        payload['waba_id'] = selected_waba_account.value
        payload['phone_number_id'] = selected_phone_number_id.value
        payload['text_message'] = text_message.value
        payload['username'] = username.value
        if(replyToMessage.value){
            payload['reply_message_id'] = replyToMessage.value.message_id
        }
        if(selected_customer.value.direction == 'in'){
            payload['recipient'] = selected_customer.value.from_number
        } else if (selected_customer.value.direction == 'out'){
            payload['recipient'] = selected_customer.value.to_number
        }
        let response = await postRequest("send_text_message",payload,token)
        if(response.request.status == 200){
            console.log(response)
        } else {
            notification_message.value = "Failed to send message"
            showToast(notification_message.value)
        }
        spin_loading.value = false
    } else {
        notification_message.value = "Please type message"
        showToast(notification_message.value)
    }
}

async function sendMediaMessage(){
    uploaded_file.value.reply_message_id = replyToMessage.value?.message_id || null;
    spin_loading.value = true
    let response = await postRequest("send_media_message",uploaded_file.value,token)
    if(response.request.status == 200){
        console.log(response)
    } else {
        notification_message.value = "Failed to send message"
        showToast(notification_message.value)
    }
    spin_loading.value = false
}


async function handleDrop(event){
    event.preventDefault();
    //clear text message
    text_message.value = null
    //try {
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.match(/^(image|video|application)\//)) return;
    // Convert image to base64 (for preview or backend upload)
    const reader = new FileReader()
    reader.onload = async (e) => {
        droppedImage.value = e.target.result;
        droppedImagePreview.value = URL.createObjectURL(file);
        uploaded_file.value = {
            waba_id: selected_waba_account.value,
            phone_number_id: selected_phone_number_id.value,
            recipient: selected_customer.value.direction === 'in'
                ? selected_customer.value.from_number
                : selected_customer.value.to_number,
            file: droppedImage.value,
            file_type: file.type,
            file_name: file.name,
            username: username.value
        }
        if (replyToMessage.value && replyToMessage.value.message_id) {
            uploaded_file.value.reply_message_id = replyToMessage.value.message_id;
        }
    }
    reader.readAsDataURL(file)
}

function handleDragOver(event) {
    event.preventDefault();
}

function deleteUploadFlile(){
    droppedImage.value = null
    droppedImagePreview.value = null
    uploaded_file.value = {}
}

function debounceReloadContacts() {
  if (reloadingContacts.value) return
  reloadingContacts.value = true
  setTimeout(async () => {
    page.value = 0
    contacts_list.value = []
    hasMore.value = true
    await getContactList()
    reloadingContacts.value = false
  }, 300) // adjust delay as needed
}

function debounceReloadConversations(contact) {
  if (reloadingConversations.value) return
  reloadingConversations.value = true
  setTimeout(async () => {
    conversations.value = []
    conversation_page.value = 0
    await getConversations(contact)
    reloadingConversations.value = false
  }, 300)
}

async function getRemarkCategories(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    let response = await postRequest("get_remark_categories",payload,token)
    if(response.status == 200){
        remark_categories.value = response['data']['categories']
    } else {
      let notification_message = "System error"
      showToast(notification_message)
    }
}

async function createRemark(){
    if (!select_remark_category.value){
        notification_message.value = "Please select remark category first"
        showToast(notification_message)
        return
    }

    if (!remark.value){
        notification_message.value = "Please type remark"
        showToast(notification_message)
        return
    }
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    payload['by_admin'] = username.value
    payload['remarkcategory'] = select_remark_category.value
    payload['remark'] = remark.value
    if(selected_customer.value.direction == 'in'){
        payload['phone_number'] = selected_customer.value.from_number
    } else if (selected_customer.value.direction == 'out'){
        payload['phone_number'] = selected_customer.value.to_number
    }
    let response = await postRequest("add_remark",payload,token)
    if(response.status == 200){
        notification_message.value = "Remark added"
        showToast(notification_message)
        getRemarks()
    } else {
        notification_message.value = "Failed to add remark"
        showToast(notification_message)
    }
}

async function getRemarks(){
    let payload = {}
    payload['waba_id'] = selected_waba_account.value
    payload['phone_number_id'] = selected_phone_number_id.value
    if(selected_customer.value.direction == 'in'){
        payload['phone_number'] = selected_customer.value.from_number
    } else if (selected_customer.value.direction == 'out'){
        payload['phone_number'] = selected_customer.value.to_number
    }
    let response = await postRequest("get_remarks",payload,token)
    if(response.status == 200){
        customer_remarks.value = response['data']['remarks']
    } else {
        notification_message.value = "Failed to get remarks"
        showToast(notification_message)
    }
}

function clearReplyMessage(){
    replyToMessage.value = null
}

checkLogin()
checkWaba()

onMounted(async() => {
        await nextTick(() =>{
            const psContainer = scrollWrapperRef.value?.querySelector('.ps')
            if (psContainer) {
                psContainer.addEventListener('scroll', handleScroll)
            } 

            const messageContainer = scrollMessageUpRef.value?.querySelector('.ps')
            if (messageContainer) {
                messageContainer.addEventListener('scroll', handleMessageScroll)
            } 
        }); 

        appOption.appContentFullHeight = true;
        appOption.appContentClass = 'p-0';
        
        setTimeout(() => {
            const container = document.querySelector('.messenger-content-body .h-100');
            container.scrollTop = container.scrollHeight;
        }, 0);
        
        const selectionContainer = document.querySelector('#selection-outer');
        const emoji = document.querySelector('#selection-emoji');
        const name = document.querySelector('#selection-name');
        const trigger = document.querySelector('#trigger');

        const picker = createPopup({}, {
            referenceElement: trigger,
            triggerElement: trigger,
            position: 'right-end'
        });

        trigger.addEventListener('click', () => {
            picker.toggle();
        });

        picker.addEventListener('emoji:select', (selection) => {
            document.getElementById('input').value = document.getElementById('input').value + selection.emoji;
            selectionContainer.classList.remove('empty');
        });

})

onBeforeUnmount(() => {
    appOption.appContentFullHeight = false
    const psContainer = scrollWrapperRef.value?.querySelector('.ps')
    if (psContainer) {
        psContainer.removeEventListener('scroll', handleScroll)
    }
    const messageContainer = scrollMessageUpRef.value?.querySelector('.ps')
    if (messageContainer) {
        messageContainer.removeEventListener('scroll', handleMessageScroll)
    }

    socketMap.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.close()
    }
    })
    socketMap.clear()

})

function selectConversation(conversation){
    replyToMessage.value = conversation
}

function openNewTab() {
  const newWindow = window.open('/page/marketing_templates', '_blank')
  const sendToken = () => {
    newWindow.postMessage({ token }, window.location.origin)
  }

  // Wait for new tab to load and request the token
  window.addEventListener('message', (event) => {
    if (event.source === newWindow && event.data === 'REQUEST_TOKEN') {
      sendToken()
    }
  })
}

watch(text_message, (newVal, oldVal) => {
    droppedImage.value = null
    droppedImagePreview.value = null
    uploaded_file.value = {}
})

</script>

<style scoped>
.image-small {
  width: 30%;
}
.white-text {
  color:white;
}

.card-wrapper {
  display: flex;
  justify-content: flex-end; /* Aligns card to the right */
  padding: 10px;
}

.whatsapp-card {
  width: fit-content;
  max-width: 300px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-family: sans-serif;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.card-content {
  padding: 12px 16px;
  position: relative;
}

.card-header {
  font-weight: bold;
  margin-bottom: 4px;
}

.card-body {
  margin-bottom: 4px;
}

.card-footer {
  color: grey;
  font-size: 12px;
}

.card-time {
  position: absolute;
  bottom: 8px;
  right: 16px;
  color: grey;
  font-size: 12px;
}

.card-button {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  padding: 10px;
  background-color: #f8f8f8;
  color: #1956cc; /* WhatsApp green */
  font-weight: 500;
  border-top: 1px solid #eee;
  cursor: pointer;
}

.card-button .icon {
  font-size: 16px;
}

.card-section {
  padding: 10px 16px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
  font-size: 14px;
}

.card-section .section-title {
  font-weight: bold;
  margin-bottom: 6px;
}

.drop-area {
  border: 2px dashed #ccc;
  padding: 10px;
  border-radius: 8px;
  position: relative;
}
.image-preview {
  margin-top: 10px;
  position: relative;
}
.image-preview img {
  max-width: 100px;
  border: 1px solid #ccc;
}
.image-preview button {
  position: absolute;
  top: 0;
  right: 0;
  background: white;
  border: none;
  cursor: pointer;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-preview-box {
  background-color: #f1f1f1;
  border-left: 4px solid #1956cc;
  padding: 8px 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  position: relative;
  font-size: 14px;
  color: #333;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  margin-bottom: 4px;
}

.reply-author {
  color: #1956cc;
}

.reply-body {
  font-style: italic;
  color: #555;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}
.close-btn:hover {
  color: #ff4d4f;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.clickable {
  cursor: pointer;
}
.reply-inside {
  border-left: 3px solid #1956cc;
  background-color: #f0f0f0;
  padding: 6px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  font-size: 13px;
  position: relative;
}

.reply-inside-author {
  font-weight: 600;
  color: #1956cc;
  margin-bottom: 2px;
}

.reply-inside-content {
  font-style: italic;
  color: #555;
  word-break: break-word;
}
.message-bubble {
  background-color: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  max-width: 300px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  word-break: break-word;
  display: inline-block;
  width: fit-content;
}

</style>

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
    <div class="messenger">
        <div class="messenger-sidebar">
            <div class="messenger-sidebar-header">
                <h3 class="mb-0">Chat</h3>
                <div class="position-relative flex-1 ps-3">
                    <v-select v-model="select_account" :options="whatsapp_accounts" label="phone_number" @update:modelValue="selectAccount"></v-select>
                </div>
            </div>
            <div ref="scrollWrapperRef" class="messenger-sidebar-body">
                <perfect-scrollbar class="h-100">
                    <div class="content">
                        <div class="messenger-item" v-for="(contact, index) in contacts_list">
                            <a href="#" data-toggle="messenger-content" class="messenger-link" :class="{ active: index === 0 }" @click.prevent="onContactClick(contact)">
                                <div class="messenger-media">
                                    <div class="messenger-badge">{{ contact.unread_count}}</div>
                                </div>
                                <div class="messenger-info">
                                    <div class="messenger-name">{{ contact.display_name }}</div>
                                    <div v-if="contact.message_type == 'text'">
                                        <div class="messenger-text">{{ contact.message.slice(0, 30) }}</div>
                                    </div>
                                    <div v-if="contact.message_type == 'image'">
                                        <div class="messenger-text">
                                            <Camera class="w-6 h-6 text-green-600" /> Image
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'video'">
                                        <div class="messenger-text">
                                            <Video class="w-6 h-6 text-green-600" /> Video
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'document'">
                                        <div class="messenger-text">
                                            <File class="w-6 h-6 text-green-600" /> Document
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'template_message'">
                                        <div class="messenger-text">
                                            <Dock class="w-6 h-6 text-green-600" /> Marketing message
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'interactivelist'">
                                        <div class="messenger-text">
                                            <List class="w-6 h-6 text-green-600" /> List
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'auto_reply_with_buttons'">
                                        <div class="messenger-text">
                                            <CircleArrowRight class="w-6 h-6 text-green-600" /> Auto reply with buttons
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'reply_button_text'">
                                        <div class="messenger-text">
                                            <CircleArrowRight class="w-6 h-6 text-green-600" /> Reply button with text
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'reply_button_url'">
                                        <div class="messenger-text">
                                            <CircleArrowRight class="w-6 h-6 text-green-600" /> Reply button with url
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'reply_button_media'">
                                        <div class="messenger-text">
                                            <CircleArrowRight class="w-6 h-6 text-green-600" /> Reply button with media
                                        </div>
                                    </div>
                                    <div v-if="contact.message_type == 'reply_button_document'">
                                        <div class="messenger-text">
                                            <CircleArrowRight class="w-6 h-6 text-green-600" /> Reply button with document
                                        </div>
                                    </div>
                                    
                                </div>
                                <div class="messenger-time-badge">
                                    <div class="messenger-time">{{formatDate(contact.last_time)}}</div>
                                    <div v-if="contact.delivery_status == 'failed'" style="text-align:right;height:10px;"><X class="w-1 h-1 text-red-300" /></div>
                                    <div v-else style="text-align:right;height:10px;"><Check class="w-1 h-1 text-green-300" /></div>  
                                </div> 
                            </a>
                        </div>  
                    </div>
                </perfect-scrollbar>
            </div>
        </div>
        <div class="messenger-content">
            <div class="messenger-content-header">
                <div class="messenger-content-header-mobile-toggler"></div>
                <div class="messenger-content-header-media"></div>
                <div class="messenger-content-header-info">
                    <h3 class="mb-0" v-if="selected_customer">{{selected_customer.display_name}} ({{ selected_phone_number }})</h3>
                </div>
                <!-- <div class="position-relative flex-1 ps-3">
                    <button type="submit" class="btn position-absolute top-0 text-inverse"><i class="bi bi-search"></i></button>
                    <input type="text" class="form-control rounded-pill ps-35px" placeholder="Search Message" />
                </div> -->
            </div>
            <div class="messenger-content-body" ref="scrollMessageUpRef">
                <perfect-scrollbar class="h-100">
                    <div class="widget-chat">
                        <div v-for="conversation, index in conversations" style="margin-bottom:5px;">
                            <div class="widget-chat-item clickable" :class="{ reply: conversation.direction !== 'in' }" @dblclick=selectConversation(conversation)>
                                <template v-if="conversation.direction === 'in'">
                                    <div class="widget-chat-media">
                                        <CircleUserRound class="w-6 h-6 text-blue-600" />
                                    </div>
                                </template>
                                <div class="widget-chat-content">
                                    <div class="message-bubble" v-if="conversation.replied_message">
                                        <div class="reply-inside">
                                            <div class="reply-inside-author">
                                                {{ conversation.replied_message_direction === 'in' ? selected_customer.display_name : 'You' }}
                                            </div>
                                            <div class="reply-inside-content">
                                                <template v-if="conversation.replied_message_type === 'text'">
                                                {{ conversation.replied_message.slice(0, 100) }}
                                                </template>
                                                <template v-else-if="conversation.replied_message_type === 'image'">📷 Image</template>
                                                <template v-else-if="conversation.replied_message_type === 'video'">🎬 Video</template>
                                                <template v-else-if="conversation.replied_message_type === 'document'">📎 Document</template>
                                                <template v-else-if="conversation.replied_message_type === 'template_message'">
                                                {{ conversation.replied_message.replace(/^(api|normal|limited_time_offer|utility):\s*/i, '') }}
                                                </template>
                                                <template v-else-if="conversation.replied_message_type === 'interactivelist'">List</template>
                                                <template v-else>Buttons</template>
                                            </div>
                                        </div>
                                        
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'text'">
                                            {{conversation.message}}
                                        </div>
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'template_message'">
                                            <Dock class="w-6 h-6 text-white-600" /> Marketing message: {{ conversation.message.replace(/^(api|normal|limited_time_offer|utility):\s*/i, '') }}
                                        </div>
                                        <div v-if="conversation.message_type == 'image'">
                                            <a :href="conversation.display_url">
                                                <img :src="conversation.display_url" class="image-small" />
                                            </a>
                                        </div>
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'document'">
                                            <a :href="conversation.display_url" class="white-text">
                                                <File class="w-6 h-6 text-white-600" />  Document 
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'video'">
                                            <video width="320" height="240" controls>
                                                <source :src="conversation.display_url" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                            <br>
                                            <a :href="conversation.display_url" class="image-small">
                                                <Video class="w-6 h-6 text-white-600" />  Download 
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'interactivelist'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-header">{{ conversation.message.interactive.header.text}}</div>
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                        <div class="card-footer">{{ conversation.message.interactive.footer.text}}</div>
                                                    </div>
                                                    <div class="card-button" @click="toggleSection(index)">
                                                        <span class="icon">📋</span> click on it
                                                    </div>
                                                    <div class="card-section" v-show="visibleSections[index]" v-for="section in conversation.message.interactive.action.sections">
                                                        <div class="section-title">{{ section.title }}</div>
                                                        <ul>
                                                            <li v-for="row in section.rows">{{ row.title }} <br> {{ row.description }}</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_media'">
                                            <div v-if="getFileExtension(conversation.message) == 'mp4'">
                                                <video width="320" height="240" controls>
                                                    <source :src="conversation.message" type="video/mp4" />
                                                </video>
                                            </div>
                                            <div v-else>
                                                <a :href="conversation.message">
                                                    <img :src="conversation.message" class="image-small" />
                                                </a>
                                            </div>        
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_document'">
                                            <a :href="conversation.message" class="blue-text">
                                                <File class="w-6 h-6 text-blue-600" /> Download
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_url'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-header">{{ conversation.message.interactive.header.text}}</div>
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                        <div class="card-footer">{{ conversation.message.interactive.footer.text}}</div>
                                                    </div>
                                                    <div class="card-button" @click="toggleSection(index)">
                                                        <a :href="conversation.message.interactive.action.parameters.url">{{conversation.message.interactive.action.parameters.display_text}}</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_text'">
                                            <div class="card-wrapper">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-body">{{ conversation.message}}</div>
                                                        </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'auto_reply_with_buttons'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                    </div>
                                                    <div class="card-button" v-for="button in conversation.message.interactive.action.buttons">
                                                        {{ button.reply.title }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="widget-chat-status">
                                            {{messageFormatDate(conversation.last_time)}}
                                            <template v-if="conversation.delivery_status == 'failed'">
                                                <X class="w-6 h-6 text-red-300" /><br>
                                                {{ conversation.status_message }}<br> please use <a href="#" @click="openNewTab">marketing message </a> to send mesage to {{selected_customer.display_name}} directly
                                            </template>
                                            <template v-else>
                                                <Check class="w-6 h-6 text-green-300" />
                                            </template>
                                        </div>     
                                    </div> 
                                    
                                    <div v-else>
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'text'">
                                            {{conversation.message}}
                                        </div>
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'template_message'">
                                            <Dock class="w-6 h-6 text-white-600" /> Marketing message: {{ conversation.message.replace(/^(api|normal|limited_time_offer|utility):\s*/i, '') }}
                                        </div>
                                        <div v-if="conversation.message_type == 'image'">
                                            <a :href="conversation.display_url">
                                                <img :src="conversation.display_url" class="image-small" />
                                            </a>
                                        </div>
                                        <div class="widget-chat-message" v-if="conversation.message_type == 'document'">
                                            <a :href="conversation.display_url" class="white-text">
                                                <File class="w-6 h-6 text-white-600" />  Document 
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'video'">
                                            <video width="320" height="240" controls>
                                                <source :src="conversation.display_url" type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                            <br>
                                            <a :href="conversation.display_url" class="image-small">
                                                <Video class="w-6 h-6 text-white-600" />  Download 
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'interactivelist'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-header">{{ conversation.message.interactive.header.text}}</div>
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                        <div class="card-footer">{{ conversation.message.interactive.footer.text}}</div>
                                                    </div>
                                                    <div class="card-button" @click="toggleSection(index)">
                                                        <span class="icon">📋</span> click on it
                                                    </div>
                                                    <div class="card-section" v-show="visibleSections[index]" v-for="section in conversation.message.interactive.action.sections">
                                                        <div class="section-title">{{ section.title }}</div>
                                                        <ul>
                                                            <li v-for="row in section.rows">{{ row.title }} <br> {{ row.description }}</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_media'">
                                            <div v-if="getFileExtension(conversation.message) == 'mp4'">
                                                <video width="320" height="240" controls>
                                                    <source :src="conversation.message" type="video/mp4" />
                                                </video>
                                            </div>
                                            <div v-else>
                                                <a :href="conversation.message">
                                                    <img :src="conversation.message" class="image-small" />
                                                </a>
                                            </div>        
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_document'">
                                            <a :href="conversation.message" class="blue-text">
                                                <File class="w-6 h-6 text-blue-600" /> Download
                                            </a>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_url'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-header">{{ conversation.message.interactive.header.text}}</div>
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                        <div class="card-footer">{{ conversation.message.interactive.footer.text}}</div>
                                                    </div>
                                                    <div class="card-button" @click="toggleSection(index)">
                                                        <a :href="conversation.message.interactive.action.parameters.url">{{conversation.message.interactive.action.parameters.display_text}}</a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'reply_button_text'">
                                            <div class="card-wrapper">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-body">{{ conversation.message}}</div>
                                                        </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="conversation.message_type == 'auto_reply_with_buttons'">
                                            <div class="card-wrapper" v-if="conversation.message.interactive">                                         
                                                <div class="whatsapp-card">
                                                    <div class="card-content">
                                                        <div class="card-body">{{ conversation.message.interactive.body.text}}</div>
                                                    </div>
                                                    <div class="card-button" v-for="button in conversation.message.interactive.action.buttons">
                                                        {{ button.reply.title }}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="widget-chat-status">
                                            {{messageFormatDate(conversation.last_time)}}
                                            <template v-if="conversation.delivery_status == 'failed'">
                                                <X class="w-6 h-6 text-red-300" /><br>
                                                {{ conversation.status_message }}<br> please use <a href="#" @click="openNewTab">marketing message </a> to send mesage to {{selected_customer.display_name}} directly
                                            </template>
                                            <template v-else>
                                                <Check class="w-6 h-6 text-green-300" />
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </perfect-scrollbar>
            </div>
            <transition name="fade">
                <div v-if="replyToMessage" class="reply-preview-box">
                    <div class="reply-header">
                        <span class="reply-author">
                        Replying to: {{ replyToMessage.direction === 'in' ? selected_customer.display_name : 'You' }}
                        </span>
                        <button class="close-btn" @click="clearReplyMessage">✖</button>
                    </div>
                    <div class="reply-body">
                        <span v-if="replyToMessage.message_type === 'text'">
                        {{ replyToMessage.message.slice(0, 100) }}
                        </span>
                        <span v-else-if="replyToMessage.message_type === 'image'">📷 Image</span>
                        <span v-else-if="replyToMessage.message_type === 'video'">🎬 Video</span>
                        <span v-else-if="replyToMessage.message_type === 'document'">📎 Document</span>
                        <span v-else-if="replyToMessage.message_type === 'interactivelist'">{{replyToMessage.message.interactive.header.text}}</span>
                        <span v-else-if="replyToMessage.message_type === 'auto_reply_with_buttons'">{{replyToMessage.message.interactive.body.text}}</span>
                        <span v-else-if="replyToMessage.message_type === 'template_message'">{{ replyToMessage.message.replace(/^(api|normal|limited_time_offer|utility):\s*/i, '') }}</span>
                        <span v-else-if="replyToMessage.message_type === 'reply_button_text'">{{replyToMessage.message}}</span>
                        <span v-else-if="replyToMessage.message_type === 'reply_button_url'">{{replyToMessage.message.interactive.header.text}}</span>
                        <span v-else-if="replyToMessage.message_type === 'reply_button_media'">{{replyToMessage.message}}</span>
                        <span v-else-if="replyToMessage.message_type === 'reply_button_document'">{{replyToMessage.message}}</span>
                        
                    </div>
                </div>
            </transition>
            <div 
                class="drop-area" 
                @drop="handleDrop" 
                @dragover="handleDragOver"
                v-if="selected_customer"
            >
                
                <div class="input-row">
                    <textarea 
                        class="form-control" 
                        v-model="text_message" 
                        rows="3" 
                        placeholder="Type a message or drop an image..."
                    ></textarea>
                    <button class="btn btn-outline-default" type="button" @click="sendMessage" v-if="text_message">
                        <i class="fa fa-paper-plane text-muted"></i>
                    </button>
                    <button class="btn btn-outline-default" type="button" @click="sendMediaMessage" v-else-if="Object.keys(uploaded_file).length > 0">
                        <i class="fa fa-paper-plane text-muted"></i>
                    </button>
                    
                    
                </div>
                <!-- Preview area -->
                <div v-if="droppedImagePreview" class="image-preview">
                    <img v-if="uploaded_file.file_type.startsWith('image/')" :src="droppedImagePreview" alt="Image Preview" class="image-small" />
                    <video
                        v-else-if="uploaded_file.file_type.startsWith('video/')"
                        class="image-small"
                        controls
                    >
                        <source :src="droppedImagePreview" :type="uploaded_file.file_type" />
                    </video>

                    <a
                        v-else-if="uploaded_file.file_type.startsWith('application/')"
                        :href="droppedImagePreview"
                        download
                        class="document-preview"
                    >
                        {{ uploaded_file.file_name }}
                    </a>
                    <button @click="deleteUploadFlile">
                    ❌
                    </button>
                </div>
            </div>
        </div>
        <div class="messenger-sidebar">
            <div class="messenger-sidebar-header">
                <h3 class="mb-0">Customer remarks</h3>
            </div>
            <card v-if="selected_customer">
                <card-body class="pb-2">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="row" style="margin-bottom:10px;">
                                <div class="flex-fill fw-bold fs-16px">Add remark for {{selected_customer.display_name}}</div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <v-select v-model="select_remark_category" :options="remark_categories" label="name" :reduce="option => option.name"></v-select>
                                </div>
                            </div>

                            <div class="row" style="margin-top:10px;">
                                <div class="col-md-12">
                                    <textarea 
                                        class="form-control" 
                                        v-model="remark" 
                                        rows="3" 
                                        placeholder="add remark"
                                    ></textarea>            
                                </div>
                            </div>
                            <div class="row" style="margin-top:10px;">
                                <div class="col-md-6">
                                    <button type="button" class="btn btn-teal me-2" @click="createRemark">Create</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </card-body>
                <div class="list-group list-group-flush" v-for="remark in customer_remarks">
					<!-- BEGIN list-group-item -->
					<a href="#" class="list-group-item list-group-item-action d-flex ps-3">
						<div class="flex-fill">
							<div class="fw-500 text-body">{{ remark.remark}}</div>
							<div class="mb-2 fs-13px">{{remark.category_name }} by {{remark.by_admin }}</div>
							<div class="mb-1">
								<span class="badge bg-pink text-white rounded-sm fs-12px fw-500">{{ remarkFormatDate(remark.created_at) }}</span>
							</div>
						</div>
					</a>
					<!-- END list-group-item -->
				</div>
            </card>
        </div>
    </div>
</template>
