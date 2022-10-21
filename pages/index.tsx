import { NextPage } from "next";
import { FormEvent, useContext, useState } from "react";

import { AuthContext } from "../context/AuthContext";

import styles from '../styles/Home.module.css';
import { withSSRGuest } from "../utils/withSSRGuest";

const Home: NextPage = () => {
  const { signIn, authChannel } = useContext(AuthContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const data = {
      email,
      password,
    }

    await signIn(data);
    authChannel?.postMessage('signIn');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.container}
    >
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  )
};

export default Home;

export const getServerSideProps = withSSRGuest(async (ctx) => {
  return {
    props: {}
  }
});
