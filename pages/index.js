import { getUserFromContext } from "../lib/auth";

export async function getServerSideProps(context) {
  const user = getUserFromContext(context);

  return {
    redirect: {
      destination: user ? "/dashboard" : "/login",
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}
