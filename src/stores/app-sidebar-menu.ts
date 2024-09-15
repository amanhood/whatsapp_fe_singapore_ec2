import { defineStore } from "pinia";

export const useAppSidebarMenuStore = defineStore({
  id: "appSidebarMenu",
  state: () => {
    return [
      {
  			text: 'Whatsapp Marketing (Business to Customers)',
  			is_header: true
  		},
      {
  			url: '/page/profile',
  			icon: 'fa fa-cog',
  			text: 'Message boardcasting'
  		},
      {
  			url: '/page/message',
  			icon: 'fa fa-cog',
  			text: 'Sending private message'
  		},
      {
  			url: '/page/auto_reply_setting',
  			icon: 'fa fa-cog',
  			text: 'Auto reply setting'
  		},
      {
        is_divider: true
      },
      {
  			text: 'Whatsapp Ecommerce',
  			is_header: true
  		},
      {
  			url: '/page/catalog',
  			icon: 'fa fa-globe',
  			text: 'Whatsapp Cart Setting'
  		},
      {
  			url: '/page/product_catalogs',
  			icon: 'fa fa-globe',
  			text: 'Product Catalogs Setup'
  		},
      {
  			url: '/page/order',
  			icon: 'fa fa-globe',
  			text: 'Orders managment'
  		},
      {
        is_divider: true
      },
      {
  			text: 'Business Strategy (Business to Business)',
  			is_header: true
  		},
      {
  			url: '/page/merchant-search',
  			icon: 'fa fa-globe',
  			text: 'Get Opponents / Partners'
  		},
      {
  			url: '/page/crawler_request',
  			icon: 'fa fa-globe',
  			text: 'Data scraping request'
  		},
      // {
  		// 	url: '/page/business_help',
  		// 	icon: 'fa fa-globe',
  		// 	text: 'Business Help'
  		// },
      {
        is_divider: true
      },
      // {
  		// 	text: 'AI Help (ChatGPT)',
  		// 	is_header: true
  		// },
      // {
  		// 	url: '/page/ai-help',
  		// 	icon: 'fa fa-globe',
  		// 	text: 'Seek AI solution'
  		// },
      // {
      //   is_divider: true
      // },
      {
        text: 'Login System',
        is_header: true
      },
      {
        url: '/page/login',
        icon: 'fa fa-user-circle',
        text: 'Login'
      },
      {
        is_divider: true
      }
    ]
  },
});
