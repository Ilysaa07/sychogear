import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/", 
          "/api/",
          "/*?sort=*",
          "/*?color=*",
          "/*?size=*"
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}
