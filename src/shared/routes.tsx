import ListDashboard from '@/dashboard/list-dashboard'
import { ApplicationLayout } from '@/shared/application-layout'
import { Route, RouteObject } from 'core/routing/route-utils'
import { routes } from './route-paths'

const homeWrapper = <ApplicationLayout />

function shippingBillPage() {
  return import('@/shipping-bills/form/shipping-bill-page')
}

export const routeObjects: RouteObject[] = [
  Route(routes.dashboard, <ListDashboard />, 'Shipping Bills', homeWrapper),
  Route(routes.shippingBillNew, shippingBillPage, 'New Shipping Bill', homeWrapper),
  Route(routes.shippingBillEdit, shippingBillPage, 'Shipping Bill', homeWrapper),
  // Misc
  Route('*', () => import('core/components/404-page'), 'Not Found')
]
