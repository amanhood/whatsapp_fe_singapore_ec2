import { defineStore } from "pinia";

export const useAppSidebarMenuStore = defineStore({
  id: "appSidebarMenu",
  state: () => {
    return [
		{
			text: 'Login System',
			is_header: true
		},
		{
			url: '/page/login',
			icon: 'fa fa-user-circle',
			text: 'Logout'
		},
		{
			is_divider: true
		},
		{
			text: 'Whatsapp and Business Account',
			is_header: true
		},
		{
			url: '/page/connect_whatsapp',
			icon: 'fa fa-user-circle',
			text: 'Connect whatsapp'
		},
		{
			url: '/page/connect-business-account',
			icon: 'fa fa-user-circle',
			text: 'Connect business'
		},
		{
			is_divider: true
		},
		{
			text: 'Marketing Message',
			is_header: true
		},
		{
			url: '/page/marketing_templates',
			icon: 'fa fa-cog',
			text: 'Manage templates'
		},
		{
			url: '/page/send_message_records',
			icon: 'fa fa-user-circle',
			text: 'Sent message records'
		},
		{
			url: '/page/client_choice_records',
			icon: 'fa fa-user-circle',
			text: 'Client choice records'
		},
		{
			is_divider: true
		},
		{
			text: 'Auto Reply of Whatspp Account',
			is_header: true
		},
		{
			url: '/page/flow_index',
			icon: 'fa fa-cog',
			text: 'Manage'
		},
		{
			is_divider: true
		},
		{
			text: 'Whatsapp Ecommerce',
			is_header: true
		},
		{
			url: '/page/whatsapp-ecommerce',
			icon: 'fa fa-cog',
			text: 'Catalogue and Product'
		},
		{
			url: '/page/delivery_fee_setting',
			icon: 'fa fa-cog',
			text: 'Delivery Fee Setting'
		},
		{
			is_divider: true
		},
		{
			text: 'Ecommerce orders',
			is_header: true
		},
		{
			url: '/page/order',
			icon: 'fa fa-cog',
			text: 'Check orders'
		},
		{
			is_divider: true
		}
    ]
  },
});
