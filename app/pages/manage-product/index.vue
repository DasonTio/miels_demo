<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import type { DisplayProduct } from '~~/app/types/product';
import type { CategoryResponse } from '~~/server/api/categories';

definePageMeta({
  layout: "authenticated"
});

const router = useRouter()
const [{ data: allProducts, pending, refresh: refreshProducts }, { data: categories }] = await Promise.all([
  useFetch<DisplayProduct[]>('/api/admin/products', { default: () => [] }),
  useFetch<CategoryResponse[]>('/api/categories', { default: () => [] }),
]);

// Filtering
const filterTab = ref('All Products');
const searchQuery = ref('');
const selectedCategory = ref('All Category');
const currentPage = ref(1);
const itemsPerPage = 10;
const openMenuId = ref<number | null>(null);

// Editing
const actionMenuRefs = ref<Record<number, HTMLElement | null>>({});
const editingProductId = ref<number | null>(null);
const editingProductData = ref<Partial<DisplayProduct>>({});
const isSaving = ref(false);

// Deleting
const productToDelete = ref<DisplayProduct | null>(null);

// Sort
const stockSortIsAsc = ref<boolean>(true);


const filteredProducts = computed(() => {
  let products = allProducts.value;
  if (filterTab.value === 'Active') products = products.filter(p => p.is_active);
  else if (filterTab.value === 'Inactive') products = products.filter(p => !p.is_active);

  if (selectedCategory.value !== 'All Category') products = products.filter(p => p.category?.slug === selectedCategory.value);
  
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
  }


  const sortedProducts = [...products];
  
  sortedProducts.sort((a,b)=>{
      const valA = a.stock ?? -1;
      const valB = b.stock ?? -1;
      const comparison = valA - valB;
      return stockSortIsAsc.value ? comparison : -comparison;
  })

  return sortedProducts
  
});

function sortByStock() {
  stockSortIsAsc.value = !stockSortIsAsc.value
}

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

watch([filterTab, searchQuery, selectedCategory], () => { currentPage.value = 1; });

const handleClickOutside = (event: MouseEvent) => {
  if (openMenuId.value === null) return;
  const activeMenu = actionMenuRefs.value[openMenuId.value];
  if (activeMenu && !activeMenu.contains(event.target as Node)) openMenuId.value = null;
};
onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

const formatPrice = (amount: number | null) => {
  if (amount === null) return 'N/A';
  return new Intl.NumberFormat('id-ID').format(amount);
};

function toggleMenu(productId: number) {
  openMenuId.value = openMenuId.value === productId ? null : productId;
}

function startEditing(product: DisplayProduct) {
  editingProductId.value = product.id;
  editingProductData.value = JSON.parse(JSON.stringify(product));
  openMenuId.value = null;
}

function cancelEditing() {
  editingProductId.value = null;
  editingProductData.value = {};
}

async function updateProduct(productId: number, payload: Partial<DisplayProduct>) {
  isSaving.value = true;
  try {
    await $fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      body: payload
    });
    await refreshProducts(); 
  } catch (err) {
    console.error("Failed to update product:", err);
  } finally {
    isSaving.value = false;
    cancelEditing();
  }
}
async function deleteProduct() {
  try {
    await $fetch(`/api/admin/products/${productToDelete.value?.id}`, {
      method: 'DELETE',
      body: { type: productToDelete.value?.type }
    });
    await refreshProducts(); 
  } catch (err) { console.error("Delete failed:", err); }
  finally{
    productToDelete.value = null
  }
}

function confirmDeleting(product: DisplayProduct) {
  openMenuId.value = null; 
  productToDelete.value = product
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  window.scrollTo({ top: document.getElementById('product-grid')?.offsetTop, behavior: 'smooth' });
}
</script>

<template>
  <section class="flex flex-col gap-6 pb-24">
    <div class="flex justify-between items-center pb-4 border-b">
      <div class="flex items-center gap-4">
        <input v-model="searchQuery" type="text" placeholder="Search Product" class="border rounded-md px-4 py-2 w-80" />
        <div class="relative">
          <select v-model="selectedCategory" class="border rounded-md px-4 py-2 appearance-none">
            <option>All Category</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.slug">{{ cat.name }}</option>
          </select>
          <Icon name="tabler:chevron-down" class="absolute right-2 top-1/2 -translate-y-1/2"/>
        </div>
      </div>
      <button class="bg-green-700 px-6 py-2.5 text-white rounded-md font-semibold" @click="router.push('/manage-product/add')">+ New Product</button>
    </div>
    <div class="flex [&>button]:py-2 gap-8">
      <button 
        v-for="value in ['All Products', 'Active', 'Inactive']" :key="value" class="py-2 border-b-2 font-medium transition-colors"
        :class="{'border-green-700 text-green-700': filterTab === value, 'border-transparent text-gray-500 hover:text-gray-800': filterTab !== value}"
        @click="filterTab = value">
        {{ value }}
      </button>
    </div>
        
    <div class="border rounded-lg overflow-x-auto">
      <table class="w-full text-sm text-left text-gray-700">
        <thead class="text-xs text-gray-500 uppercase bg-gray-50">
          <tr>
            <th scope="col" width="50%" class="px-6 py-3">Product Information</th>
            <th scope="col" width="10%" class="px-6 py-3 text-right">Price (Rp)</th>
            <th scope="col" width="10%" class="px-6 py-3 text-center flex items-center">
              <button class="flex items-center gap-2 group mx-auto" @click="sortByStock">
                Stock
                <Icon 
                  name="tabler:arrows-sort"
                  class="w-4 h-4 text-gray-300 group-hover:text-gray-500"
                  :class="[{
                    '-scale-x-100':stockSortIsAsc,
                  }]"
                />
              </button>
            </th>
            <th scope="col" width="10%" class="px-6 py-3 text-center">Active</th>
            <th scope="col" width="10%" class="px-6 py-3 text-center">Best Seller</th>
            <th scope="col" width="10%" class="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending"><td colspan="6" class="text-center p-8">Loading...</td></tr>
          <tr v-else-if="paginatedProducts.length === 0"><td colspan="6" class="text-center p-8">No products found.</td></tr>
          <template v-else>
            <tr v-for="product in paginatedProducts" :key="product.id" class="bg-white border-b hover:bg-gray-50">
            <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <img :src="product.images[0] || '/placeholder.png'" class="w-12 h-12 object-cover rounded-md" alt="Product Image" >
                  <div>
                    <div class="font-bold text-gray-900">
                      <UiHighlightText :text="product.name" :query="searchQuery" />
                    </div>
                    <div class="text-xs text-gray-500">{{ product.category?.name || 'Uncategorized' }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-mono text-right">
                <input v-if="editingProductId === product.id" v-model.number="editingProductData.price" type="number" class="w-24 border rounded-md px-2 py-1 text-right" />
                <span v-else>{{ formatPrice(product.price) }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <input v-if="editingProductId === product.id && product.type === 'product'" v-model.number="editingProductData.stock" type="number" class="w-20 border rounded-md px-2 py-1 text-center" />
                <span v-else>{{ product.stock ?? 'N/A' }}</span>
              </td>
              <td class="px-6 py-4 text-center">
                <button @click="updateProduct(product.id, { type: product.type, is_active: !product.is_active })" :class="['w-11 h-6 rounded-full p-1 transition-colors', product.is_active ? 'bg-green-600' : 'bg-gray-300']">
                  <div :class="['w-4 h-4 rounded-full bg-white transition-transform', { 'transform translate-x-5': product.is_active }]"/>
                </button>
              </td>
              <td class="px-6 py-4 text-center">
                <button @click="updateProduct(product.id, { type: product.type, is_best_seller: !product.is_best_seller })">
                  <Icon name="fa6-solid:star" :class="['w-5 h-5 transition-colors', product.is_best_seller ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300']"/>
                </button>
              </td>
              <td 
                :ref="(el) => {actionMenuRefs[product.id] = el as HTMLElement}" 
                class="px-6 py-4 text-center relative" >
                <div v-if="editingProductId === product.id" class="flex items-center justify-center gap-2">
                  <button @click="cancelEditing" class="text-red-500 hover:text-red-700 p-1 disabled:opacity-50" :disabled="isSaving"><Icon name="fa6-solid:xmark" class="w-5 h-5" /></button>
                  <button @click="updateProduct(product.id, editingProductData)" class="text-green-500 hover:text-green-700 p-1 disabled:opacity-50" :disabled="isSaving"><Icon name="fa6-solid:check" class="w-5 h-5" /></button>
                </div>
                <div v-else>
                  <button @click="toggleMenu(product.id)" class="text-gray-500 hover:text-gray-800 p-2 rounded-full"><Icon name="fa6-solid:ellipsis-vertical" class="w-5 h-5"/></button>
                  <div v-if="openMenuId === product.id" class="absolute right-2 -bottom-5 w-32 bg-white border rounded-md shadow-lg z-10">
                    <button @click="startEditing(product)" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Edit</button>
                    <button @click="confirmDeleting(product)" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="flex justify-between items-center text-sm text-gray-600">
      <p>Showing {{ Math.min((currentPage - 1) * itemsPerPage + 1, filteredProducts.length) }} - {{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }} of {{ filteredProducts.length }}</p>
      <div class="flex items-center space-x-1">
        <button 
          :disabled="currentPage === 1" 
          class="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" 
          @click="changePage(currentPage - 1)" 
        >
          &laquo;
        </button>
        <button 
          v-for="page in totalPages" 
          :key="page" 
          :class="['px-4 py-2 border rounded-md', currentPage === page ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-100']"
          @click="changePage(page)" 
        >
          {{ page }}
        </button>
        <button 
          :disabled="currentPage === totalPages" 
          class="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" 
          @click="changePage(currentPage + 1)"
        >
          &raquo;
        </button>
      </div>
    </div>
    <UiConfirmationModal 
      v-if="productToDelete"
      title="Delete Product"
      :message="`Are you sure you want to permanently delete ${productToDelete.name}? This action cannot be undone.`"
      @cancel="productToDelete = null"
      @confirm="deleteProduct"
    />
  </section>

  
</template>