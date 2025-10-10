<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { DisplayProduct } from '~~/app/types/product';
import type { CategoryResponse } from '~~/server/api/categories';

definePageMeta({
  layout: "authenticated"
});

// --- DATA FETCHING ---
const [{ data: allProducts, pending }, { data: categories }] = await Promise.all([
  useFetch<DisplayProduct[]>('/api/products', { default: () => [] }),
  useFetch<CategoryResponse[]>('/api/categories', { default: () => [] }),
]);

// --- STATE MANAGEMENT ---
const filterTab = ref('All Products');
const searchQuery = ref('');
const selectedCategory = ref('All Category');
const currentPage = ref(1);
const itemsPerPage = 10;
const openMenuId = ref<number | null>(null);
const actionMenuRefs = ref<Record<number, HTMLElement | null>>({});

// --- COMPUTED PROPERTIES ---
const filteredProducts = computed(() => {
  let products = allProducts.value;
  if (filterTab.value === 'Active') products = products.filter(p => p.is_active);
  else if (filterTab.value === 'Inactive') products = products.filter(p => !p.is_active);
  if (selectedCategory.value !== 'All Category') products = products.filter(p => p.category?.slug === selectedCategory.value);
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(lowerCaseQuery) ||
      p.category?.name.toLowerCase().includes(lowerCaseQuery)
    );
  }
  return products;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

watch([filterTab, searchQuery, selectedCategory], () => {
  currentPage.value = 1;
});

// --- CLICK OUTSIDE LOGIC ---
const handleClickOutside = (event: MouseEvent) => {
  if (openMenuId.value === null) return;
  const activeMenu = actionMenuRefs.value[openMenuId.value];
  if (activeMenu && !activeMenu.contains(event.target as Node)) {
    openMenuId.value = null;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

// --- HELPER FUNCTIONS ---
const formatPrice = (amount: number | null) => {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID').format(amount);
};

// --- ACTION HANDLERS ---
function toggleMenu(productId: number) {
  openMenuId.value = openMenuId.value === productId ? null : productId;
}
function editProduct(product: DisplayProduct) { console.log('Editing:', product.name); openMenuId.value = null; }
function deleteProduct(product: DisplayProduct) { console.log('Deleting:', product.name); openMenuId.value = null; }
function toggleActive(product: DisplayProduct) { console.log(`Toggling active for ${product.name}`); }
function toggleBestSeller(product: DisplayProduct) { console.log(`Toggling best seller for ${product.name}`); }
function openNewProductModal() { console.log('Opening new product modal'); }
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex justify-between items-center pb-4 border-b">
      <div class="flex items-center gap-4">
        <input v-model="searchQuery" type="text" placeholder="Search Product Name, SKU, BPOM" class="border rounded-md px-4 py-2 w-80" />
        <select v-model="selectedCategory" class="border rounded-md px-4 py-2">
          <option>All Category</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option>
        </select>
      </div>
      <button class="bg-green-700 px-6 py-2.5 text-white rounded-md font-semibold" @click="openNewProductModal">+ New Product</button>
    </div>
    
    <div class="flex [&>button]:py-2 gap-8">
      <button v-for="value in ['All Products', 'Active', 'Inactive']" :key="value" class="py-2 border-b-2 font-medium transition-colors"
        :class="{'border-green-700 text-green-700': filterTab === value, 'border-transparent text-gray-500 hover:text-gray-800': filterTab !== value}"
        @click="filterTab = value">
        {{ value }}
      </button>
    </div>
        
    <div class="border rounded-lg overflow-x-auto">
      <table class="w-full text-sm text-left text-gray-700">
        <thead class="text-xs text-gray-500 uppercase bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3">Product Information</th>
            <th scope="col" class="px-6 py-3 text-right">Price (Rp)</th>
            <th scope="col" class="px-6 py-3 text-center">Stock</th>
            <th scope="col" class="px-6 py-3 text-center">Active</th>
            <th scope="col" class="px-6 py-3 text-center">Best Seller</th>
            <th scope="col" class="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="6" class="text-center p-8">Loading...</td></tr>
          <tr v-else-if="paginatedProducts.length === 0"><td colspan="6" class="text-center p-8">No products found.</td></tr>
          <tr v-else v-for="product in paginatedProducts" :key="product.id" class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-4">
              <div class="flex items-center gap-4">
                <img :src="product.images[0] || '/placeholder.png'" class="w-12 h-12 object-cover rounded-md" alt="Product Image" />
                <div>
                  <div class="font-bold text-gray-900">{{ product.name }}</div>
                  <div class="text-xs text-gray-500">{{ product.category?.name || 'Uncategorized' }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 font-mono text-right">{{ formatPrice(product.price) }}</td>
            <td class="px-6 py-4 text-center">{{ product.stock ?? 'N/A' }}</td>
            <td class="px-6 py-4 text-center">
              <button @click="toggleActive(product)" :class="['w-11 h-6 rounded-full p-1 transition-colors', product.is_active ? 'bg-green-600' : 'bg-gray-300']">
                <div :class="['w-4 h-4 rounded-full bg-white transition-transform', { 'transform translate-x-5': product.is_active }]"/>
              </button>
            </td>
            <td class="px-6 py-4 text-center">
              <button @click="toggleBestSeller(product)">
                <Icon name="fa6-solid:star" :class="['w-5 h-5 transition-colors', product.is_best_seller ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300']"/>
              </button>
            </td>
            <td :ref="(el)=>{actionMenuRefs[product.id] = el as HTMLElement}" class="px-6 py-4 text-center relative">
              
              <button 
                class="text-gray-500 hover:text-gray-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300" 
                @click="toggleMenu(product.id)">
                <Icon name="fa6-solid:ellipsis-vertical" class="w-5 h-5"/>
              </button>

              <div v-if="openMenuId === product.id" class="absolute right-10 w-32 bg-white border rounded-md shadow-lg z-10">
                <button 
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  @click="editProduct(product)" 
                  >Edit</button>
                <button 
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  @click="deleteProduct(product)" 
                >Delete</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center text-sm text-gray-600">
      <p>Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length) }} - {{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }} of {{ filteredProducts.length }}</p>
      <div class="flex items-center space-x-1">
        <button :disabled="currentPage === 1" class="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" @click="currentPage--">&laquo;</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" class="p-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" @click="currentPage++">&raquo;</button>
      </div>
    </div>
  </section>
</template>