# Migration path from Angular monolithic SPA app, to micro-frontends featuring Qwik, Analog and Angular SSR.

> [!IMPORTANT]
> README and CODE SAMPLE status is WORK IN PROGRESS

This sample demonstrates how to migrate a monolithic Angular SPA e-commerce application to a micro-frontend architecture using  [Web Fragments](https://github.com/web-fragments/web-fragments).

## Application design

The e-commerce application consists of a Homepage default route featuring a catalog and the shopping cart area. 

![webfragments_demo_homepage](https://github.com/user-attachments/assets/1990859c-ce48-49b5-8c99-0d53a82c6625)

Catalog cards link directly to the product detail page.
![webfragments_demo_detail](https://github.com/user-attachments/assets/174c2487-8043-44bc-a546-91e41b02233b)


## Application structure

The user interface is composed by the following components

- homepage
- product page
- product detail
- product card
- shopping cart

## Migration excercise 

The decoupling and migration excercise consists in horizontally splitting the monolithic UI and codebase into multiple applications that are independently developed, released, versioned and deployed, with the following correspondence,

Homepage + productpage -> Shell application HTML
Product catalog -> Micro-frontend split 1 -> Angular SSR
Product detail -> Micro-frontend split 2 -> Analog SSG
Shopping cart -> Micro-frontend split 3 -> Qwik 

## Come back soon! This is a work in progress

Come back often, while we work on the demo and slides! In the mean time you can learn more about micro-frontends and modern frontend development visiting [microfrontend.dev](https://microfrontend.dev) and learn more about Web Fragments following [this link](https://blog.cloudflare.com/better-micro-frontends)

🫶
