# Migration path from Angular monolithic SPA app, to micro-frontends featuring Qwik, Analog and Angular SSR.

> [!IMPORTANT]
> README and CODE SAMPLE status is WORK IN PROGRESS

This sample demonstrates how to migrate a monolithic Angular SPA e-commerce application to a micro-frontend architecture using  [Web Fragments](https://github.com/web-fragments/web-fragments).

## Application design

The e-commerce application consists of a Homepage default route featuring a catalog and the shopping cart area. 
![ecommerce app](https://github.com/user-attachments/assets/2947391b-ab67-4e17-990a-fde10facb87d)

Catalog cards link directly to the product detail page.
![detail page](https://github.com/user-attachments/assets/11fbfccb-6e59-43f7-a7d2-cf8c16bf5915)

## Application structure

The user interface is composed by the following components

- homepage
- product page
- product detail
- product card
- shopping cart

## Migration excercise 

The decoupling and migration excercise consists in horizontally splitting the monolithic UI and codebase into multiple applications that are independently developed, released, versioned and deployed, with the following correspondence,

- Homepage + productpage -> Shell application HTML
- Product catalog -> Micro-frontend split 1 -> Analog.js
- Product detail -> Micro-frontend split 1 -> Analog.js
- Shopping cart -> Micro-frontend split 2 -> Qwik

![web-fragments drawio](https://github.com/user-attachments/assets/e088f739-6418-4610-aba6-df8424040599)


## Come back soon! This is a work in progress

Come back often, while we work on the demo and slides! In the mean time you can learn more about micro-frontends and modern frontend development visiting [microfrontend.dev](https://microfrontend.dev) and learn more about Web Fragments following [this link](https://blog.cloudflare.com/better-micro-frontends)

🫶
