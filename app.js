import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjnuLCinerxH_q0IV28V_4GChZfB-g1Bg",
  authDomain: "movie-watchlist-7883c.firebaseapp.com",
  projectId: "movie-watchlist-7883c",
  storageBucket: "movie-watchlist-7883c.firebasestorage.app",
  messagingSenderId: "585421393583",
  appId: "1:585421393583:web:b3c62cb16d99d8e3a18e5a",
  measurementId: "G-JK4G632NR7"
};

const TMDB_API = "35a7c9cb588541cf79e297fbeb46e131";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const moviesRef = collection(db, "movies");
const commentsRef = collection(db, "comments");

const movieGrid = document.getElementById("movieGrid");
const watchedGrid = document.getElementById("watchedGrid");

const searchInput = document.getElementById("movieSearch");
const searchResults = document.getElementById("searchResults");

const randomBtn = document.getElementById("randomBtn");
const randomResult = document.getElementById("randomResult");

let movies = [];

async function searchMovie(queryText) {

  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API}&language=ru-RU&query=${queryText}`
  );

  const data = await response.json();

  renderSearch(data.results.slice(0, 8));

}

function renderSearch(results) {

  searchResults.innerHTML = "";

  results.forEach(movie => {

    const card = document.createElement("div");
    card.className = "search-item";

    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/500x750?text=Movie";

    card.innerHTML = `
      <img src="${poster}">

      <div>
        <h3>${movie.title}</h3>
        <p>${movie.release_date || ""}</p>
      </div>
    `;

    card.onclick = async () => {

      await addDoc(moviesRef, {
        title: movie.title,
        desc: movie.overview,
        poster,
        watched: false,
        createdAt: Date.now()
      });

      searchInput.value = "";
      searchResults.innerHTML = "";

    };

    searchResults.appendChild(card);

  });

}

searchInput.addEventListener("input", () => {

  if(searchInput.value.length < 2) {
    searchResults.innerHTML = "";
    return;
  }

  searchMovie(searchInput.value);

});

function createMovieCard(movie, id) {

  const card = document.createElement("div");
  card.className = "movie-card";

  card.innerHTML = `

    <img src="${movie.poster}">

    <div class="movie-content">

      <div class="movie-title">
        ${movie.title}
      </div>

      <div class="movie-desc">
        ${movie.desc || "Описание скоро появится 🍿"}
      </div>

      <div class="movie-buttons">

        <button class="watch-btn">
          ${movie.watched ? "✅ Просмотрено" : "🍿 Посмотрели"}
        </button>

        <button class="delete-btn">
          ✖
        </button>

      </div>

      <div class="comments">

        <input
          class="comment-input"
          placeholder="Комментарий..."
        >

        <div class="comment-list"></div>

      </div>

    </div>
  `;

  const watchBtn = card.querySelector(".watch-btn");
  const deleteBtn = card.querySelector(".delete-btn");
  const commentInput = card.querySelector(".comment-input");
  const commentList = card.querySelector(".comment-list");

  watchBtn.onclick = async () => {

    await updateDoc(doc(db, "movies", id), {
      watched: !movie.watched
    });

  };

  deleteBtn.onclick = async () => {

    await deleteDoc(doc(db, "movies", id));

  };

  commentInput.addEventListener("keypress", async (e) => {

    if(e.key !== "Enter") return;

    if(!commentInput.value.trim()) return;

    await addDoc(commentsRef, {
      movieId: id,
      text: commentInput.value,
      createdAt: Date.now()
    });

    commentInput.value = "";

  });

  onSnapshot(query(commentsRef, orderBy("createdAt")), snapshot => {

    commentList.innerHTML = "";

    snapshot.forEach(docItem => {

      const comment = docItem.data();

      if(comment.movieId !== id) return;

      const div = document.createElement("div");
      div.className = "comment";

      div.textContent = comment.text;

      commentList.appendChild(div);

    });

  });

  if(movie.watched) {
    watchedGrid.appendChild(card);
  } else {
    movieGrid.appendChild(card);
  }

}

onSnapshot(query(moviesRef, orderBy("createdAt", "desc")), snapshot => {

  movieGrid.innerHTML = "";
  watchedGrid.innerHTML = "";

  movies = [];

  snapshot.forEach(docItem => {

    const movie = docItem.data();

    movies.push(movie);

    createMovieCard(movie, docItem.id);

  });

  updateStats();

});

function updateStats() {

  const total = movies.length;
  const watched = movies.filter(m => m.watched).length;
  const left = total - watched;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("watchedCount").textContent = watched;
  document.getElementById("leftCount").textContent = left;

  const percent = total
    ? Math.round((watched / total) * 100)
    : 0;

  document.getElementById("progressFill").style.width = `${percent}%`;

  document.getElementById("progressText").textContent =
    `Вы посмотрели ${percent}% списка`;

}

randomBtn.onclick = () => {

  const available = movies.filter(m => !m.watched);

  if(!available.length) return;

  const random =
    available[Math.floor(Math.random() * available.length)];

  randomResult.innerHTML = `
    🍿 Сегодня ваш вечер:
    <br><br>
    <strong>${random.title}</strong>
  `;

};

if("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}