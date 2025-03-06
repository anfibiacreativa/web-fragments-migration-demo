<template>
  <div class="product-card" @click="$emit('click')">
    <img :src="product.imageUrl" :alt="product.name" />
    <div class="content">
      <h2>{{ product.name }}</h2>
      <p>{{ product.description }}</p>

      <!-- Star Rating Component -->
      <StarRating :rating="product.rating" />

      <div class="footer">
        <span class="price">${{ product.price }}</span>
        <button class="button" @click.stop>Add to Cart</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import type { Product } from '../types/types'; // Ensure the Product type is correctly imported
import StarRating from './StarRating.vue';

defineProps<{
  product: Product;
}>();
</script>
