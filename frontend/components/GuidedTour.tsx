"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTourStore } from "@/lib/store/tour";

export function GuidedTour() {
  const { hasCompletedTour, shouldShowTour, completeTour, skipTour } =
    useTourStore();

  useEffect(() => {
    // Auto-start tour if user hasn't completed it and we're showing it
    if (!hasCompletedTour && shouldShowTour) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startTour();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, shouldShowTour]);

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: [
        {
          element: "body",
          popover: {
            title: "🎉 Bienvenue dans Demo Advanced",
            description:
              "Découvrez toutes les fonctionnalités premium de cette démo interactive en quelques étapes. Vous pouvez passer le tour à tout moment.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="catalog"]',
          popover: {
            title: "📦 Catalogue Produits",
            description:
              "Parcourez notre catalogue de produits premium avec images HD, descriptions IA et filtres avancés. Cliquez sur un produit pour voir les détails complets.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="cart"]',
          popover: {
            title: "🛒 Panier Intelligent",
            description:
              "Ajoutez des produits au panier et voyez le total se mettre à jour en temps réel. Support des paliers de quantité et calcul automatique des prix.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="favorites"]',
          popover: {
            title: "⭐ Favoris",
            description:
              "Sauvegardez vos produits préférés pour y accéder rapidement plus tard. Les favoris sont synchronisés avec votre compte.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="account"]',
          popover: {
            title: "👤 Compte & Admin",
            description:
              "Accédez à votre profil, historique de commandes et au panneau d'administration complet avec gestion produits, catégories et paramètres.",
            side: "top",
            align: "center",
          },
        },
        {
          element: '[data-tour="theme-switcher"]',
          popover: {
            title: "🎨 15+ Thèmes Premium",
            description:
              "Changez l'apparence avec nos thèmes VDS 2026 : Apple Liquid Glass, Neon Micro-Glow, Cinematic Gradient et bien plus. Chaque thème est optimisé WCAG.",
            side: "left",
            align: "start",
          },
        },
        {
          element: "body",
          popover: {
            title: "✨ Outils IA Intégrés",
            description:
              "Dans l'admin, découvrez les AI Tools : générateur de descriptions, parser de menus et extraction de paramètres. Automatisez votre workflow !",
            side: "top",
            align: "center",
          },
        },
        {
          element: "body",
          popover: {
            title: "🚀 Prêt à explorer !",
            description:
              "Vous connaissez maintenant les bases. Explorez librement et profitez de toutes les fonctionnalités. Vous pouvez relancer ce tour depuis les paramètres admin.",
            side: "top",
            align: "center",
          },
        },
      ],
      onDestroyStarted: () => {
        // User clicked close or finished tour
        driverObj.destroy();
        completeTour();
      },
      onCloseClick: () => {
        // User clicked close button
        skipTour();
      },
    });

    driverObj.drive();
  };

  return null; // This component doesn't render anything
}

// Export function to manually start tour (from admin settings)
export function startGuidedTour() {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        element: "body",
        popover: {
          title: "🎉 Bienvenue dans Demo Advanced",
          description:
            "Découvrez toutes les fonctionnalités premium de cette démo interactive en quelques étapes. Vous pouvez passer le tour à tout moment.",
          side: "top",
          align: "center",
        },
      },
      {
        element: '[data-tour="catalog"]',
        popover: {
          title: "📦 Catalogue Produits",
          description:
            "Parcourez notre catalogue de produits premium avec images HD, descriptions IA et filtres avancés. Cliquez sur un produit pour voir les détails complets.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: '[data-tour="cart"]',
        popover: {
          title: "🛒 Panier Intelligent",
          description:
            "Ajoutez des produits au panier et voyez le total se mettre à jour en temps réel. Support des paliers de quantité et calcul automatique des prix.",
          side: "top",
          align: "center",
        },
      },
      {
        element: '[data-tour="favorites"]',
        popover: {
          title: "⭐ Favoris",
          description:
            "Sauvegardez vos produits préférés pour y accéder rapidement plus tard. Les favoris sont synchronisés avec votre compte.",
          side: "top",
          align: "center",
        },
      },
      {
        element: '[data-tour="account"]',
        popover: {
          title: "👤 Compte & Admin",
          description:
            "Accédez à votre profil, historique de commandes et au panneau d'administration complet avec gestion produits, catégories et paramètres.",
          side: "top",
          align: "center",
        },
      },
      {
        element: '[data-tour="theme-switcher"]',
        popover: {
          title: "🎨 15+ Thèmes Premium",
          description:
            "Changez l'apparence avec nos thèmes VDS 2026 : Apple Liquid Glass, Neon Micro-Glow, Cinematic Gradient et bien plus. Chaque thème est optimisé WCAG.",
          side: "left",
          align: "start",
        },
      },
      {
        element: "body",
        popover: {
          title: "✨ Outils IA Intégrés",
          description:
            "Dans l'admin, découvrez les AI Tools : générateur de descriptions, parser de menus et extraction de paramètres. Automatisez votre workflow !",
          side: "top",
          align: "center",
        },
      },
      {
        element: "body",
        popover: {
          title: "🚀 Prêt à explorer !",
          description:
            "Vous connaissez maintenant les bases. Explorez librement et profitez de toutes les fonctionnalités. Vous pouvez relancer ce tour depuis les paramètres admin.",
          side: "top",
          align: "center",
        },
      },
    ],
  });

  driverObj.drive();
}
