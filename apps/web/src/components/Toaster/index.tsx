// Inline Toaster component to keep it simple, or we can move it to components/Toaster
import { ToastSeverity } from "@/types/contact";
import { Snackbar, Alert } from "@mui/material";

interface ToasterProps {
    open: boolean;
    message: string;
    severity: ToastSeverity;
    onClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

export const Toaster: React.FC<ToasterProps> = ({ open, message, severity, onClose }) => {
    return (
        <Snackbar
            open={open}
            autoHideDuration={5000}
            onClose={onClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert onClose={onClose} severity={severity} variant="standard" sx={{ width: "100%" }}>
                {message}
            </Alert>
        </Snackbar>
    );
};
