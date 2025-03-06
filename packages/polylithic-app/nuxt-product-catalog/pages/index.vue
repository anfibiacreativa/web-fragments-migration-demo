<template>
  <div>
    <header></header>

    <main class="container">
      <div v-if="pending" class="loading">Loading products...</div>
      <div v-else-if="error" class="error">{{ error.message }}</div>
      <div v-else class="products-grid">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
          @click="navigateToProduct(product.id)"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from '#app';
import { products as mockProducts } from '../data/product-catalog-mock';

const { data: products, pending, error } = await useAsyncData('products', async () => {
  try {
    if (process.server) {
      console.log('SSR Products Data:', mockProducts);
    }
    return mockProducts;
  } catch (err) {
    console.error('Failed to fetch products:', err);
    throw new Error('Failed to fetch products');
  }
});

const router = useRouter();
const navigateToProduct = (id: number) => {
  router.push(`/products/${id}`);
};
</script>
