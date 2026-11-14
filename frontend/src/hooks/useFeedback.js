import { useContext } from "react";
import { FeedbackContext } from "../components/ui/feedback-context";

function useFeedback() {
  const contexto = useContext(FeedbackContext);
  if (!contexto) throw new Error("useFeedback debe utilizarse dentro de FeedbackProvider");
  return contexto;
}

// toast.exito("Guardado"), toast.error(err.message), toast.info("…")
export const useToast = () => useFeedback().toast;

// const ok = await confirmar({ titulo, mensaje, accion, peligro })
export const useConfirmar = () => useFeedback().confirmar;
