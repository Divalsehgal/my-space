import localFont from "next/font/local";


export const StackHans = localFont({
    src: [
        {
            path: "../assets/StackSans-Regular.ttf",
            weight: "400",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Bold.ttf",
            weight: "700",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Medium.ttf",
            weight: "500",
            style: "normal"
        },
        {
            path: "../assets/StackSans-SemiBold.ttf",
            weight: "600",
            style: "normal"
        },
        {
            path: "../assets/StackSans-Light.ttf",
            weight: "300",
            style: "normal"
        },
        {
            path: "../assets/StackSans-ExtraLight.ttf",
            weight: "200",
            style: "normal"
        }

    ],
    variable: "--font-body",
    display: "swap",
    fallback: ["Arial", "sans-serif"]
})