import { defineStore } from "pinia";

const role = sessionStorage.getItem('role');
if (role === 'parent') {
	console.log('User is a parent');
  } else if (role === 'child') {
	console.log('User is a child');
  }

interface MenuItem {
	text?: string;
	url?: string;
	icon?: string;
	is_header?: boolean;
	is_divider?: boolean;
}

interface SidebarState {
	userRole: string | null
	menuItems: MenuItem[]
}

export const useAppSidebarMenuStore = defineStore<'appSidebarMenu', SidebarState>({
	id: 'appSidebarMenu',
  
	state: (): SidebarState => ({
	  userRole: sessionStorage.getItem('role'),
	  menuItems: [
		{ text: 'Login System', is_header: true },
		{ url: '/page/login', icon: 'fa fa-user-circle', text: 'Logout' },
		{ is_divider: true },
		{ text: 'Sub-Account Management', is_header: true },
		{ url: '/page/sub-accounts', icon: 'fa fa-user-circle', text: 'Management' },
		{ is_divider: true },
		{ text: 'Whatsapp and Business Account', is_header: true },
		{ url: '/page/connect_whatsapp', icon: 'fa fa-user-circle', text: 'Connect whatsapp' },
		{ url: '/page/connect-business-account', icon: 'fa fa-user-circle', text: 'Connect business' },
		{ is_divider: true },
		{ text: 'Messages', is_header: true },
		{ url: '/page/messages', icon: 'fa fa-cog', text: 'Check messages' },
		{ is_divider: true },
		{ text: 'Marketing Message', is_header: true },
		{ url: '/page/marketing_templates', icon: 'fa fa-cog', text: 'Manage templates' },
		{ url: '/page/send_message_records', icon: 'fa fa-user-circle', text: 'Sent message records' },
		{ url: '/page/client_choice_records', icon: 'fa fa-user-circle', text: 'Client choice records' },
		{ is_divider: true },
		{ text: 'Auto Reply of Whatspp Account', is_header: true },
		{ url: '/page/flow_index', icon: 'fa fa-cog', text: 'Manage' },
		{ is_divider: true },
		{ text: 'Whatsapp Ecommerce', is_header: true },
		{ url: '/page/whatsapp-ecommerce', icon: 'fa fa-cog', text: 'Catalogue and Product' },
		{ url: '/page/delivery_fee_setting', icon: 'fa fa-cog', text: 'Delivery Fee Setting' },
		{ is_divider: true },
		{ text: 'Ecommerce orders', is_header: true },
		{ url: '/page/order', icon: 'fa fa-cog', text: 'Check orders' },
		{ is_divider: true }
	  ]
	}),
  
	getters: {
	  filteredMenuItems: (state): MenuItem[] => {
		if (state.userRole === 'child') {
		  return state.menuItems.filter(
			item => item.text === 'Messages' || item.url === '/page/messages'
		  )
		}
		return state.menuItems
	  }
	}
  })