<script setup lang="ts">
import { useAppSidebarMenuStore } from '@/stores/app-sidebar-menu';
import { useAppOptionStore } from '@/stores/app-option';
import { onMounted,ref, computed, watch,nextTick } from 'vue';
import { slideToggle } from '@/composables/slideToggle.js';
import { slideUp } from '@/composables/slideUp.js';
import { slideDown } from '@/composables/slideDown.js';
import SidebarNav from '@/assets/components/app/SidebarNav.vue';
import { getRequest,postRequest,deleteRequest } from '@/composables/api.js'


let menu = ref([])
let username = ref(null)
let token = ref(null)
let role = ref(sessionStorage.getItem('role'))
let whatsapp_accounts_number = ref(0)
token = ref(sessionStorage.getItem("token"))
username = ref(sessionStorage.getItem("username"))
whatsapp_accounts_number.value = sessionStorage.getItem("whatsapp_accounts_number")

// const appSidebarMenu = useAppSidebarMenuStore();
// const menuItems = computed(() => appSidebarMenu.filteredMenuItems)

const fullMenu = [
    { text: 'Login System', is_header: true },
    { url: '/page/login', icon: 'fa fa-user-circle', text: 'Logout' },
    { is_divider: true },
    { text: 'Sub-Account Management', is_header: true },
    { url: '/page/sub-accounts', icon: 'fa fa-user-circle', text: 'Management' },
    { is_divider: true },
    { text: 'Whatsapp and Business Account', is_header: true },
    { url: '/page/connect-whatsapp', icon: 'fa fa-cog', text: 'Connect whatsapp' },
    { url: '/page/connect-business-account', icon: 'fa fa-cog', text: 'Connect business' },
    { is_divider: true },
    { text: 'Customer Messages', is_header: true },
    { url: '/page/check-messages', icon: 'fa fa-cog', text: 'Messages' },
    { url: '/page/remark-categories', icon: 'fa fa-cog', text: 'Remark categories' },
    { is_divider: true },
    { text: 'Marketing Message', is_header: true },
    { url: '/page/marketing-templates', icon: 'fa fa-cog', text: 'Manage templates' },
    { url: '/page/landing-pages', icon: 'fa fa-cog', text: 'Manage landing page' },
    { url: '/page/send-message-records', icon: 'fa fa-cog', text: 'Sent message records' },
    { url: '/page/client-choice-records', icon: 'fa fa-cog', text: 'Client choice records' },
    { url: '/page/submitted-form-records', icon: 'fa fa-cog', text: 'Submitted form records' },
    { is_divider: true },
    { text: 'Auto Reply of Whatspp Account', is_header: true },
    { url: '/page/flow-index', icon: 'fa fa-cog', text: 'Manage' },
    { is_divider: true },
    { text: 'Whatsapp Ecommerce', is_header: true },
    { url: '/page/whatsapp-ecommerce', icon: 'fa fa-cog', text: 'Catalogue and product' },
    { url: '/page/delivery-fee-setting', icon: 'fa fa-cog', text: 'Delivery fee setting' },
    { url: '/page/order', icon: 'fa fa-cog', text: 'Check orders' },
    { is_divider: true }
]
const menuItems = ref([])

const updateMenuByRole = (role: string | null) => {
  if (role === 'child') {
    menuItems.value = fullMenu.filter(
      (item) => item.text === 'Message' || item.url === '/page/check-messages'
    )
  } else {
    menuItems.value = fullMenu
  }
}

watch(() => role.value, (newRole) => {
  updateMenuByRole(newRole)
})

// onMounted(() => {
  
// })


const appOption = useAppOptionStore();
var appSidebarFloatSubmenuTimeout = 0;
var appSidebarFloatSubmenuDom = '';

function appSidebarMobileToggled() {
    appOption.appSidebarMobileToggled = !appOption.appSidebarMobileToggled;
}

function handleSidebarMinifyFloatMenuClick() {
    var elms = [].slice.call(document.querySelectorAll('.app-float-submenu .menu-item.has-sub > .menu-link'));
    if (elms) {
        elms.map(function(elm) {
            elm.onclick = function(e) {
                e.preventDefault();
                var targetItem = this.closest('.menu-item');
                var target = targetItem.querySelector('.menu-submenu');
                var targetStyle = getComputedStyle(target);
                var close = (targetStyle.getPropertyValue('display') != 'none') ? true : false;
                var expand = (targetStyle.getPropertyValue('display') != 'none') ? false : true;
                
                slideToggle(target);
                
                var loopHeight = setInterval(function() {
                    var targetMenu = document.querySelector('.app-float-submenu') as HTMLElement | null;
                    if (!targetMenu) return;
                    var targetHeight = targetMenu.clientHeight;
                    var targetOffset = targetMenu.getBoundingClientRect();
                    var targetOriTop = Number(targetMenu.getAttribute('data-offset-top'));
                    var targetMenuTop = Number(targetMenu.getAttribute('data-menu-offset-top'));
                    var targetTop    = Number(targetOffset.top);
                    var windowHeight = document.body.clientHeight;
                    if (close) {
                        if (targetTop > targetOriTop) {
                            targetTop = (targetTop > targetOriTop) ? targetOriTop : targetTop;
                            targetMenu.style.top = targetTop + 'px';
                            targetMenu.style.bottom = 'auto';
                        }
                    }
                    if (expand) {
                        if ((windowHeight - targetTop) < targetHeight) {
                            var arrowBottom = (windowHeight - targetMenuTop) - 22;
                            targetMenu.style.top = 'auto';
                            targetMenu.style.bottom = '0';
                        }
                        var floatSubmenuElm = document.querySelector('.app-float-submenu');
                        if (targetHeight > windowHeight) {
                            if (floatSubmenuElm) {
                                var splitClass = ('overflow-scroll mh-100vh').split(' ');
                                for (var i = 0; i < splitClass.length; i++) {
                                    floatSubmenuElm.classList.add(splitClass[i]);
                                }
                            }
                        }
                    }
                }, 1);
                setTimeout(function() {
                    clearInterval(loopHeight);
                }, 250);
            }
        });
    }
}

function handleSidebarMinifyFloatMenu() {
    var elms = [].slice.call(document.querySelectorAll('.app-sidebar .menu > .menu-item.has-sub > .menu-link'));
    let floatSubmenuElm: HTMLElement | null = null;
    if (elms) {
        elms.map(function(elm) {
            elm.onmouseenter = function() {
                var appElm = document.querySelector('.app');
                if (appElm && appElm.classList.contains('app-sidebar-minified')) {
                    clearTimeout(appSidebarFloatSubmenuTimeout);
                    var targetMenu = this.closest('.menu-item').querySelector('.menu-submenu');
                    if (appSidebarFloatSubmenuDom == this && document.querySelector('.app-float-submenu')) {
                        return;
                    } else {
                        appSidebarFloatSubmenuDom = this;
                    }
                    var targetMenuHtml = targetMenu.innerHTML;
                    if (targetMenuHtml) {
                        var bodyStyle     = getComputedStyle(document.body);
                        var sidebarOffset = document.querySelector('.app-sidebar').getBoundingClientRect();
                        const sidebar = document.querySelector('.app-sidebar') as HTMLElement | null;
                        if (!sidebar) return;

                        var sidebarWidth = sidebar.clientWidth;
                        //var sidebarWidth  = parseInt(document.querySelector('.app-sidebar').clientWidth);
                        var sidebarX      = (bodyStyle.getPropertyValue('direction') != 'rtl') ? (sidebarOffset.left + sidebarWidth) : (document.body.clientWidth - sidebarOffset.left);
                        var targetHeight  = handleGetHiddenMenuHeight(targetMenu);
                        var targetOffset  = this.getBoundingClientRect();
                        var targetTop     = targetOffset.top;
                        var targetLeft    = (bodyStyle.getPropertyValue('direction') != 'rtl') ? sidebarX : 'auto';
                        var targetRight   = (bodyStyle.getPropertyValue('direction') != 'rtl') ? 'auto' : sidebarX;
                        var windowHeight  = document.body.clientHeight;
                        
                        if (!document.querySelector('.app-float-submenu')) {
                            var overflowClass = '';
                            if (targetHeight > windowHeight) {
                                overflowClass = 'overflow-scroll mh-100vh';
                            }
                            var html = document.createElement('div');
                            html.setAttribute('id', 'app-float-submenu');
                            html.setAttribute('class', 'app-float-submenu '+ overflowClass);
                            html.setAttribute('data-offset-top', targetTop);
                            html.setAttribute('data-menu-offset-top', targetTop);
                            html.innerHTML = targetMenuHtml;
                            appElm.appendChild(html);
                            
                            var elm = document.getElementById('app-float-submenu');
                            elm.onmouseover = function() {
                                clearTimeout(appSidebarFloatSubmenuTimeout);
                            };
                            elm.onmouseout = function() {
                                appSidebarFloatSubmenuTimeout = setTimeout(() => {
                                    document.querySelector('.app-float-submenu').remove();
                                }, 250);
                            };
                        } else {
                            var floatSubmenu = document.querySelector('.app-float-submenu');
                            var floatSubmenuElm = document.querySelector('.app-float-submenu');
                            
                            if (targetHeight > windowHeight) {
                                if (floatSubmenuElm) {
                                    var splitClass = ('overflow-scroll mh-100vh').split(' ');
                                    for (var i = 0; i < splitClass.length; i++) {
                                        floatSubmenuElm.classList.add(splitClass[i]);
                                    }
                                }
                            }
                            floatSubmenu.setAttribute('data-offset-top', targetTop);
                            floatSubmenu.setAttribute('data-menu-offset-top', targetTop);
                            floatSubmenuElm.innerHTML = targetMenuHtml;
                        }
                
                        const submenuElm = document.querySelector('.app-float-submenu') as HTMLElement | null;
                        if (submenuElm) {
                            const targetHeight = submenuElm.clientHeight;
                        }
                        floatSubmenuElm = document.querySelector('.app-float-submenu') as HTMLElement | null;
                        if ((windowHeight - targetTop) > targetHeight) {
                            if (floatSubmenuElm instanceof HTMLElement) {
                            floatSubmenuElm.style.top = `${targetTop}px`;
                            floatSubmenuElm.style.bottom = 'auto';
                            floatSubmenuElm.style.left = typeof targetLeft === 'number' ? `${targetLeft}px` : targetLeft;
                            floatSubmenuElm.style.right = typeof targetRight === 'number' ? `${targetRight}px` : targetRight;
                            }
                        } else {
                            var arrowBottom = (windowHeight - targetTop) - 21;
                            if (floatSubmenuElm instanceof HTMLElement) {
                                floatSubmenuElm.style.top = 'auto';
                                floatSubmenuElm.style.left = targetLeft + 'px';
                                floatSubmenuElm.style.bottom = "0";
                                floatSubmenuElm.style.right = targetRight + 'px';
                            }
                        }
                        handleSidebarMinifyFloatMenuClick();
                    } else {
                        appSidebarFloatSubmenuDom = '';
                        document.querySelector('.app-float-submenu').remove();
                    }
                }
            }
            elm.onmouseleave = function() {
                var elm = document.querySelector('.app');
                if (elm && elm.classList.contains('app-sidebar-minified')) {
                    appSidebarFloatSubmenuTimeout = setTimeout(() => {
                        appSidebarFloatSubmenuDom = '';
                        document.querySelector('.app-float-submenu').remove();
                    }, 250);
                }
            }
        });
    }
};

function handleGetHiddenMenuHeight(elm) {
    elm.setAttribute('style', 'position: absolute; visibility: hidden; display: block !important');
    var targetHeight  = elm.clientHeight;
    elm.removeAttribute('style');
    return targetHeight;
}

onMounted(() => {
    updateMenuByRole(role.value)
    var handleSidebarMenuToggle = function(menus, expandTime) {
        menus.map(function(menu) {
            menu.onclick = function(e) {
                e.preventDefault();
                var target = this.nextElementSibling;
    
                menus.map(function(m) {
                    var otherTarget = m.nextElementSibling;
                    if (otherTarget !== target) {
                        slideUp(otherTarget, expandTime);
                        otherTarget.closest('.menu-item').classList.remove('expand');
                        otherTarget.closest('.menu-item').classList.add('closed');
                    }
                });
    
                var targetItemElm = target.closest('.menu-item');
            
                if (targetItemElm.classList.contains('expand') || (targetItemElm.classList.contains('active') && !target.style.display)) {
                    targetItemElm.classList.remove('expand');
                    targetItemElm.classList.add('closed');
                    slideToggle(target, expandTime);
                } else {
                    targetItemElm.classList.add('expand');
                    targetItemElm.classList.remove('closed');
                    slideToggle(target, expandTime);
                }
            }
        });
    };
    
    var menuBaseSelector = '.app-sidebar .menu > .menu-item.has-sub';
    var submenuBaseSelector = ' > .menu-submenu > .menu-item.has-sub';

    // menu
    var menuLinkSelector =  menuBaseSelector + ' > .menu-link';
    var menus = [].slice.call(document.querySelectorAll(menuLinkSelector));
    handleSidebarMenuToggle(menus,undefined);

    // submenu lvl 1
    var submenuLvl1Selector = menuBaseSelector + submenuBaseSelector;
    var submenusLvl1 = [].slice.call(document.querySelectorAll(submenuLvl1Selector + ' > .menu-link'));
    handleSidebarMenuToggle(submenusLvl1,undefined);

    // submenu lvl 2
    var submenuLvl2Selector = menuBaseSelector + submenuBaseSelector + submenuBaseSelector;
    var submenusLvl2 = [].slice.call(document.querySelectorAll(submenuLvl2Selector + ' > .menu-link'));
    handleSidebarMenuToggle(submenusLvl2,undefined);    
    handleSidebarMinifyFloatMenu();


});
</script>

<style>
.app-sidebar {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-sidebar-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>

<template>
    <div id="sidebar" class="app-sidebar h-screen flex flex-col overflow-hidden">
        <perfect-scrollbar class="app-sidebar-content flex-1 overflow-hidden">
            <div class="menu flex flex-col grow">
                <template v-for="menu in menuItems">
                    <div class="menu-header" v-if="menu.is_header">{{ menu.text }}</div>
                    <div class="menu-divider" v-else-if="menu.is_divider"></div>
                    <template v-else>
                        <sidebar-nav v-if="menu.text" v-bind:menu="menu"></sidebar-nav>
                    </template>
                </template>
                
            </div>
        </perfect-scrollbar>
        <button class="app-sidebar-mobile-backdrop" v-on:click="appSidebarMobileToggled"></button>
    </div>
</template>
git token. Press Tab to insert.