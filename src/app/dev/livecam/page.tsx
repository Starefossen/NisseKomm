import { redirect } from "next/navigation";

// The LiveCam effect preview lives in the parent guide's TV look-through.
export default function LiveCamDevPage() {
  redirect("/nissemor-guide/media#gjennomsyn");
}
