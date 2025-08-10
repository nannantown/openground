<template>
  <button
    @click.prevent="toggleFav"
    class="favourite-btn"
    :class="{ active: isFavourite }"
    :disabled="pending"
    :title="isFavourite ? 'お気に入りから削除' : 'お気に入りに追加'"
  >
    <span class="heart-icon">
      {{ isFavourite ? '❤️' : '🤍' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~~/composables/useAuth'
import { useFavourites } from '~~/composables/useFavourites'

const props = defineProps<{
  listingId: string
  favouriteIds?: string[]
}>()

const emit = defineEmits<{
  toggle: [listingId: string]
}>()

const { user } = useAuth()
const { addFavourite, removeFavourite } = useFavourites()

const pending = ref(false)
const localFavourites = ref(new Set(props.favouriteIds || []))

const isFavourite = computed(() => localFavourites.value.has(props.listingId))

const toggleFav = async () => {
  if (!user.value) {
    // Redirect to login page
    await navigateTo('/login')
    return
  }

  try {
    pending.value = true
    
    if (isFavourite.value) {
      await removeFavourite(props.listingId)
      localFavourites.value.delete(props.listingId)
    } else {
      await addFavourite(props.listingId)
      localFavourites.value.add(props.listingId)
    }
    
    // Emit toggle event to parent
    emit('toggle', props.listingId)
  } catch (error) {
    console.error('Error toggling favourite:', error)
    alert('エラーが発生しました。もう一度お試しください。')
    // Revert the local state on error
    if (isFavourite.value) {
      localFavourites.value.add(props.listingId)
    } else {
      localFavourites.value.delete(props.listingId)
    }
  } finally {
    pending.value = false
  }
}

// Watch for prop changes to keep local state in sync
watch(() => props.favouriteIds, (newIds) => {
  if (newIds) {
    localFavourites.value = new Set(newIds)
  }
}, { immediate: true })
</script>

<style scoped>
.favourite-btn {
  background: rgba(0, 0, 0, 0.6);
  border: none;
  border-radius: var(--radius-full);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 10;
}

.favourite-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.favourite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.favourite-btn.active {
  background: rgba(239, 68, 68, 0.9);
}

.favourite-btn.active:hover {
  background: rgba(239, 68, 68, 1);
}

.heart-icon {
  font-size: 1.25rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>