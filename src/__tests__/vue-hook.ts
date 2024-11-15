import { ref, type Ref } from 'vue'
import { defineHook, InjectionKey } from '../vue'

export interface UseUser {
  user: Ref<{ name: string }>
  hello: () => string
}
export const UserKey = InjectionKey<UseUser>('UseUser')

export const useUser = defineHook<typeof UserKey>(() => {
  const user = ref({ name: 'John' })

  return {
    user,
    hello: () => `Hello ${user.value.name}`,
  }
})
