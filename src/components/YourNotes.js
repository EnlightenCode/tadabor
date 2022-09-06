import { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

import { db } from "../util/db";
import axios from "axios";

import { toast } from "react-toastify";

function YourNotes() {
  const [loadingState, setLoadingState] = useState(true);
  const [myNotes, setMyNotes] = useState({});

  const chapterNames = useRef([]);
  const allQuranText = useRef([]);

  useEffect(() => {
    let clientLeft = false;

    fetchData();

    async function fetchData() {
      let userNotes = await db.notes.toArray();

      if (clientLeft) return;

      let extractNotes = {};
      userNotes.forEach((note) => {
        extractNotes[note.id] = note.text;
      });

      setMyNotes(extractNotes);

      let response = await axios.get("/res/chapters.json");

      if (clientLeft) return;

      if (!chapterNames.current.length) {
        chapterNames.current = response.data;
      }

      response = await axios.get("/res/quran_v2.json");

      if (clientLeft) return;

      if (!allQuranText.current.length) {
        allQuranText.current = response.data;
      }

      setLoadingState(false);
    }

    return () => {
      clientLeft = true;
    };
  }, []);

  if (loadingState) return <LoadingSpinner />;

  return (
    <YourNotesLoaded
      myNotes={myNotes}
      setMyNotes={setMyNotes}
      chapterNames={chapterNames.current}
      allQuranText={allQuranText.current}
    />
  );
}

const YourNotesLoaded = ({
  myNotes,
  setMyNotes,
  chapterNames,
  allQuranText,
}) => {
  const [editableNotes, setEditableNotes] = useState({});

  const convertKey = (key) => {
    let info = key.split("-");
    return chapterNames[info[0] - 1].name + ":" + info[1];
  };

  const getVerse = (key) => {
    let info = key.split("-");
    return allQuranText[info[0] - 1].verses[info[1] - 1].versetext;
  };

  function handleEditOnClick(key) {
    setEditableNotes((state) => {
      return { ...state, [key]: true };
    });
  }

  const memoHandleEditOnClick = useCallback(handleEditOnClick, []);

  function handleNoteSave(note_key) {
    db.notes
      .put({
        id: note_key,
        text: myNotes[note_key],
        date_created: Date.now(),
        date_modified: Date.now(),
      })
      .then(function (result) {
        //
        toast.success("تم الحفظ بنجاح.");
        setEditableNotes((state) => {
          return { ...state, [note_key]: false };
        });
      })
      .catch(function (error) {
        //
        toast.success("فشلت عملية الحفظ.");
      });
  }

  function handleNoteChange(event) {
    const { name, value } = event.target;

    setMyNotes((state) => {
      return { ...state, [name]: value };
    });
  }

  return (
    <div className="pt-2 pb-2">
      {Object.keys(myNotes).map((key) => (
        <div key={key} className="card mb-3">
          <div className="card-header">
            {convertKey(key)} <br /> {getVerse(key)}{" "}
          </div>
          {editableNotes[key] ? (
            <NoteFormCompoent
              note_text={myNotes[key]}
              note_key={key}
              handleNoteSave={handleNoteSave}
              handleNoteChange={handleNoteChange}
            />
          ) : (
            <NoteTextComponent
              note_text={myNotes[key]}
              note_key={key}
              handleEditOnClick={memoHandleEditOnClick}
            />
          )}
        </div>
      ))}
    </div>
  );
};

const NoteTextComponent = ({ note_text, note_key, handleEditOnClick }) => {
  return (
    <>
      <div className="card-body">
        <p style={{ whiteSpace: "pre-wrap" }}>{note_text}</p>
      </div>
      <div className="card-footer text-center">
        <button
          onClick={(e) => handleEditOnClick(note_key)}
          className="btn btn-success"
        >
          Edit
        </button>
      </div>
    </>
  );
};

const NoteFormCompoent = ({
  note_text,
  note_key,
  handleNoteSave,
  handleNoteChange,
}) => {
  const [rows, setRows] = useState(4);

  useEffect(() => {
    const rowlen = note_text.split("\n");

    if (rowlen.length >= 4) {
      setRows(rowlen.length + 1);
    } else {
      setRows(4);
    }
  }, [note_text]);

  return (
    <>
      <div className="card-body">
        <textarea
          className="form-control mb-2"
          id="textInput"
          placeholder="أدخل كتاباتك"
          name={note_key}
          value={note_text}
          onChange={handleNoteChange}
          rows={rows}
          required
        />
      </div>
      <div className="card-footer text-center">
        <button
          onClick={(e) => handleNoteSave(note_key)}
          className="btn btn-success"
        >
          Save
        </button>
      </div>
    </>
  );
};

export default YourNotes;
