import React from "react";
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
  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" href="/favicon.png" />
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