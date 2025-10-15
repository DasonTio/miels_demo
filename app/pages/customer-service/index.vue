<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Tables } from '~~/app/types/database';

definePageMeta({
  middleware:"auth"
});

const { data: tickets, pending, refresh } = await useFetch<Tables<'tickets'>[]>('/api/tickets', { default: () => [] });

const activeTab = ref<'ongoing' | 'closed'>('ongoing');

const ongoingTickets = computed(() => tickets.value.filter(t => t.status === 'ongoing' || t.status === "resolved"));
const closedTickets = computed(() => tickets.value.filter(t => t.status === 'closed' ));

const displayedTickets = computed(() => activeTab.value === 'ongoing' ? ongoingTickets.value : closedTickets.value);

const expandedTicketId = ref<number | null>(null);

function toggleTicket(id: number) {
  expandedTicketId.value = expandedTicketId.value === id ? null : id;
}

async function markAsResolved(ticketId: number) {
  try {
    await $fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      body: { status: 'resolved' }
    });
    await refresh(); 
  } catch (err) {
    console.error("Failed to mark as resolved", err);
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <section class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-4xl font-serif text-gray-800">Ticket Support</h1>
        <NuxtLink to="/customer-service/new" class="bg-green-700 text-white px-6 py-2.5 rounded-md font-semibold flex">
          Create New Ticket
        </NuxtLink>
      </div>
  
      <div class="flex border-b mb-6">
        <button :class="['py-2 px-4 font-semibold', activeTab === 'ongoing' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-500']" @click="activeTab = 'ongoing'">Ongoing</button>
        <button :class="['py-2 px-4 font-semibold', activeTab === 'closed' ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-500']" @click="activeTab = 'closed'">Closed</button>
      </div>
  
      <div v-if="pending">Loading tickets...</div>
      <div v-else-if="displayedTickets.length === 0" class="text-center text-gray-500 py-12">
        You don't have any {{ activeTab }} tickets.
      </div>
  
      <div v-else class="space-y-2">
        <div class="hidden md:grid grid-cols-4 gap-4 bg-gray-100 p-4 rounded-t-lg font-bold text-sm">
          <div>Ticket ID</div>
          <div>Issue Type</div>
          <div>Date Created</div>
          <div>Status</div>
        </div>
        <div v-for="ticket in displayedTickets" :key="ticket.id" class="border rounded-lg">
          <div class="grid grid-cols-4 gap-4 p-4 cursor-pointer hover:bg-gray-50 items-center" @click="toggleTicket(ticket.id)">
            <div class="font-semibold">{{ ticket.ticket_id }}</div>
            <div>{{ ticket.issue_type.replace('_', ' ') }}</div>
            <div>{{ new Date(ticket.created_at!).toLocaleString() }}</div>
            <div class="flex items-center justify-between">
              <span :class="['px-2 py-1 text-xs rounded-full', { 'bg-yellow-100 text-yellow-800': ticket.status === 'ongoing', 'bg-blue-100 text-blue-800': ticket.status === 'resolved', 'bg-gray-200 text-gray-800': ticket.status === 'closed' }]">
                {{ ticket.status }}
              </span>
              <Icon name="tabler:chevron-down" :class="['transition-transform', { 'rotate-180': expandedTicketId === ticket.id }]" />
            </div>
          </div>
          <div v-if="expandedTicketId === ticket.id" class="p-6 bg-gray-50 border-t">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><strong class="block text-gray-500">Phone Number:</strong> {{ ticket.contact_phone }}</div>
              <div><strong class="block text-gray-500">Email:</strong> {{ ticket.contact_email }}</div>
              <div class="col-span-2"><strong class="block text-gray-500">Transaction Reference:</strong> {{ ticket.transaction_reference }}</div>
              <div class="col-span-2"><strong class="block text-gray-500">Description:</strong> <p>{{ ticket.description }}</p></div>
              <div class="col-span-2"><strong class="block text-gray-500 mb-2">Supporting Files:</strong>
                <div class="flex gap-2">
                  <a v-for="file in (ticket.supporting_files || [])" :key="file" :href="file" target="_blank" class="w-16 h-16 border rounded-md overflow-hidden">
                    <img :src="file" class="w-full h-full object-cover" >
                  </a>
                </div>
              </div>
            </div>
            <div v-if="ticket.status === 'ongoing'" class="mt-6 border-t pt-4 text-center">
              <p class="text-sm mb-2">Has this issue been resolved?</p>
              <button class="border border-green-700 text-green-700 px-6 py-2 rounded-md font-semibold hover:bg-green-50" @click="markAsResolved(ticket.id)">
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>