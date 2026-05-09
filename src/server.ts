import { app } from "./app";

const parsedPort = Number(process.env.PORT);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

