import React, { useEffect } from "react";
import { Toaster } from "../src/components/ui/toaster";
import { Toaster as Sonner } from "../src/components/ui/sonner";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import "../src/index.css";
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  // Clean up any existing service workers from PWA implementation
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          registration.unregister().then(function(boolean) {
            console.log('Service worker unregistered:', boolean);
          });
        }
      });
    }
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Sistema de registro e controle de voos de balonismo da AVIBAQ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Component {...pageProps} />
      </TooltipProvider>
      <Analytics />
    </QueryClientProvider>
  );
}

export default MyApp; 