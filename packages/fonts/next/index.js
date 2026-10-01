import localFont from "next/font/local";


export const StackHans = localFont({
    src: [
        {
            path: "../assets/StackSans-Regular.woff2",
            weight: "400",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Bold.woff2",
            weight: "700",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Medium.woff2",
            weight: "500",
            style: "normal"
        },
        {
            path: "../assets/StackSans-SemiBold.woff2",
            weight: "600",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Light.woff2",
            weight: "300",
            style: "normal"
        },
        {
            path: "../assets/StackSans-ExtraLight.woff2",
            weight: "200",
            style: "normal"
        }

    ],
    variable: "--font-body",
    display: "swap",
    fallback: ["Arial", "sans-serif"]
})