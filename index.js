require("dotenv").config();
const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const PORT = 6498;

let users = [];

app.get("/", (req, res) => {
  res.send("Running");
});

const updateUsers = (id) => {
  if (!users.includes(id)) {
    users.unshift({ id });
  }
  console.log(io.sockets);
  io.sockets.emit("users", users);
};

const removeUser = (id) => {
  users = users.filter((user) => user.id !== id);
  io.sockets.emit("users", users);
};

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  updateUsers(socket.id);

  socket.on("disconnect", () => {
    socket.broadcast.emit("callEnded");
    removeUser(socket.id);
  });

  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("callEnded", ({call, id}) => {
    io.to(call.from).emit("callEnded", id);
  });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
