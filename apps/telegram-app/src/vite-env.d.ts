/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: import('@cinacoin/telegram-miniapp').TelegramWebApp;
  };
  TelegramWebApp?: import('@cinacoin/telegram-miniapp').TelegramWebApp;
}
