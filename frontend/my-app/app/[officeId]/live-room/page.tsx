import { redirect } from "next/navigation";

type OfficeRoomsPageProps = {
  params: {
    officeId: string;
  };
};

export default function OfficeRoomsPage({ params }: OfficeRoomsPageProps) {
  redirect(`/${params.officeId}/room`);
}