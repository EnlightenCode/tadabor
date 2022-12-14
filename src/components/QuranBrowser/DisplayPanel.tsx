import {
  useReducer,
  Reducer,
  useEffect,
  useRef,
  useCallback,
  memo,
  Fragment,
  createContext,
  useContext,
} from "react";

import { toast } from "react-toastify";
import { INote, INoteDir, loadData, saveData } from "../../util/db";

import LoadingSpinner from "../LoadingSpinner";
import { ArrowDownCircleFill } from "react-bootstrap-icons";

import { TextForm } from "../TextForm";

import * as bootstrap from "bootstrap";
import { useTranslation } from "react-i18next";

import useQuran, { verseProps } from "../../context/QuranContext";

import {
  QB_ACTIONS,
  searchIndexProps,
  SEARCH_SCOPE,
  useQuranBrowser,
} from "../../pages/QuranBrowser";

enum DP_ACTIONS {
  SET_LOADING_STATE = "dispatchSetLoadingState",
  SET_USER_NOTES = "dspatchSetUserNotes",
  CHANGE_NOTE = "dispatchChangeNote",
  SET_EDITABLE_NOTES = "dispatchSetEditableNotes",
  CHANGE_NOTE_EDITABLE = "dipsatchChangeNoteEditable",
  SET_AREA_DIRECTION = "dispatchSetAreaDirection",
  CHANGE_NOTE_DIRECTION = "dispatchChangeNoteDirection",
  SUBMIT_NOTE = "dispatchSubmitNote",
  DATA_LOADED = "dispatchDataLoaded",
  SET_SCROLL_KEY = "dispatchSetScrollKey",
}

interface reducerAction {
  type: DP_ACTIONS;
  payload: any;
}

interface refVersesResultType {
  [key: string]: HTMLDivElement;
}

interface notesType {
  [key: string]: string;
}

interface markedNotesType {
  [key: string]: boolean;
}

interface stateProps {
  loadingState: boolean;
  myNotes: notesType;
  editableNotes: markedNotesType;
  areaDirection: notesType;
  scrollKey: null | string;
}

function reducer(state: stateProps, action: reducerAction): stateProps {
  // ...
  switch (action.type) {
    case DP_ACTIONS.SET_LOADING_STATE: {
      return { ...state, loadingState: action.payload };
    }
    case DP_ACTIONS.SET_USER_NOTES: {
      return { ...state, myNotes: action.payload };
    }
    case DP_ACTIONS.CHANGE_NOTE: {
      return {
        ...state,
        myNotes: {
          ...state.myNotes,
          [action.payload.name]: action.payload.value,
        },
      };
    }
    case DP_ACTIONS.SET_EDITABLE_NOTES: {
      return { ...state, editableNotes: action.payload };
    }
    case DP_ACTIONS.CHANGE_NOTE_EDITABLE: {
      return {
        ...state,
        editableNotes: {
          ...state.editableNotes,
          [action.payload.name]: action.payload.value,
        },
      };
    }
    case DP_ACTIONS.SET_AREA_DIRECTION: {
      return { ...state, areaDirection: action.payload };
    }
    case DP_ACTIONS.CHANGE_NOTE_DIRECTION: {
      return {
        ...state,
        areaDirection: {
          ...state.areaDirection,
          [action.payload.name]: action.payload.value,
        },
      };
    }
    case DP_ACTIONS.SUBMIT_NOTE: {
      return {
        ...state,
        editableNotes: {
          ...state.editableNotes,
          [action.payload.name]: false,
        },
      };
    }
    case DP_ACTIONS.DATA_LOADED: {
      return {
        ...state,
        myNotes: action.payload.extractNotes,
        editableNotes: action.payload.markedNotes,
        areaDirection: action.payload.extractNotesDir,
        loadingState: false,
      };
    }
    case DP_ACTIONS.SET_SCROLL_KEY: {
      return { ...state, scrollKey: action.payload };
    }
    default: {
      throw Error("Unknown action: " + action.type);
    }
  }
}

interface DisplayPanelProps {
  searchingChapters: string[];
  searchResult: verseProps[];
  searchError: boolean;
  selectedRootError: boolean;
  searchingString: string;
  selectChapter: number;
  radioSearchingMethod: string;
  searchIndexes: searchIndexProps[];
  searchingScope: SEARCH_SCOPE;
}

type DisplayPanelContent = {
  dispatchDpAction: (type: DP_ACTIONS, payload: any) => void;
};

const DisplayPanelContext = createContext<DisplayPanelContent>({
  dispatchDpAction: () => {},
});

const useDisplayPanel = () => useContext(DisplayPanelContext);

const DisplayPanel = memo(
  ({
    searchingChapters,
    searchResult,
    searchError,
    selectedRootError,
    searchingString,
    selectChapter,
    radioSearchingMethod,
    searchIndexes,
    searchingScope,
  }: DisplayPanelProps) => {
    // memorize the Div element of the results list to use it later on to reset scrolling when a new search is submitted
    const refListVerses = useRef<HTMLDivElement>(null);

    const initialState: stateProps = {
      loadingState: true,
      myNotes: {},
      editableNotes: {},
      areaDirection: {},
      scrollKey: null,
    };

    const [state, dispatch] = useReducer<Reducer<stateProps, reducerAction>>(
      reducer,
      initialState
    );

    const dispatchDpAction = useCallback(
      (type: DP_ACTIONS, payload: any) => dispatch({ type, payload }),
      []
    );

    useEffect(() => {
      let clientLeft = false;

      fetchData();

      async function fetchData() {
        let userNotes: INote[] = await loadData("notes");

        if (clientLeft) return;

        let markedNotes: markedNotesType = {};
        let extractNotes: notesType = {};
        userNotes.forEach((note) => {
          extractNotes[note.id] = note.text;
          markedNotes[note.id] = false;
        });

        let userNotesDir: INoteDir[] = await loadData("notes_dir");

        if (clientLeft) return;

        let extractNotesDir: notesType = {};

        userNotesDir.forEach((note) => {
          extractNotesDir[note.id] = note.dir;
        });

        dispatchDpAction(DP_ACTIONS.DATA_LOADED, {
          extractNotes,
          markedNotes,
          extractNotesDir,
        });
      }

      return () => {
        clientLeft = true;
      };
    }, [dispatchDpAction]);

    const scrollRef = useRef(state.scrollKey);

    useEffect(() => {
      scrollRef.current = state.scrollKey;
    }, [state.scrollKey]);

    useEffect(() => {
      if (refListVerses.current && scrollRef.current === null)
        refListVerses.current.scrollTop = 0;
    }, [selectChapter, searchResult]);

    if (state.loadingState)
      return (
        <div className="col h-75">
          <div className="h-100">
            <LoadingSpinner />
          </div>
        </div>
      );

    return (
      <DisplayPanelContext.Provider value={{ dispatchDpAction }}>
        <div className="browser-display" ref={refListVerses}>
          <div className="card browser-display-card" dir="rtl">
            {searchResult.length || searchError || selectedRootError ? (
              <ListSearchResults
                versesArray={searchResult}
                selectChapter={selectChapter}
                searchToken={searchingString.trim()}
                searchingScope={searchingScope}
                searchError={searchError}
                selectedRootError={selectedRootError}
                radioSearchMethod={radioSearchingMethod}
                searchingChapters={searchingChapters}
                searchIndexes={searchIndexes}
                editableNotes={state.editableNotes}
                myNotes={state.myNotes}
                areaDirection={state.areaDirection}
              />
            ) : (
              <ListVerses
                selectChapter={selectChapter}
                scrollKey={state.scrollKey}
                myNotes={state.myNotes}
                editableNotes={state.editableNotes}
                areaDirection={state.areaDirection}
              />
            )}
          </div>
        </div>
      </DisplayPanelContext.Provider>
    );
  }
);

DisplayPanel.displayName = "DisplayPanel";

const ListSearchResults = memo(
  ({
    versesArray,
    selectChapter,
    searchToken,
    searchError,
    selectedRootError,
    radioSearchMethod,
    myNotes,
    editableNotes,
    searchingChapters,
    searchIndexes,
    areaDirection,
    searchingScope,
  }: any) => {
    const { chapterNames } = useQuran();
    const { dispatchDpAction } = useDisplayPanel();

    const refVersesResult = useRef<refVersesResultType>({});

    const refSelectedVerse = useRef<HTMLDivElement | null>(null);

    function handleRootClick(verse_key: string) {
      refVersesResult.current[verse_key].scrollIntoView({ behavior: "smooth" });

      if (refSelectedVerse.current) {
        refSelectedVerse.current.classList.remove("verse-selected");
      }

      refVersesResult.current[verse_key].classList.add("verse-selected");

      refSelectedVerse.current = refVersesResult.current[verse_key];
    }

    const memoHandleRootClick = useCallback(handleRootClick, []);

    const isRootSearch =
      radioSearchMethod === "optionRootSearch" ? true : false;

    const chapterName = chapterNames[selectChapter - 1].name;

    return (
      <>
        <SearchTitle
          radioSearchMethod={radioSearchMethod}
          searchToken={searchToken}
          searchingScope={searchingScope}
          searchChapters={searchingChapters}
          chapterName={chapterName}
        />
        {isRootSearch && (
          <DerivationsComponent
            handleRootClick={memoHandleRootClick}
            searchIndexes={searchIndexes}
          />
        )}
        <div className="card-body">
          {versesArray.map((verse: verseProps) => (
            <div
              key={verse.key}
              ref={(el) => {
                if (el !== null) refVersesResult.current[verse.key] = el;
              }}
              className="border-bottom pt-1 pb-1"
            >
              <SearchVerseComponent
                verse={verse}
                searchingScope={searchingScope}
                verseChapter={chapterNames[Number(verse.suraid) - 1].name}
                value={myNotes[verse.key] || ""}
                isEditable={editableNotes[verse.key]}
                noteDirection={areaDirection[verse.key] || ""}
                isRootSearch={isRootSearch}
                searchIndexes={searchIndexes}
                dispatchDpAction={dispatchDpAction}
              />
            </div>
          ))}
          {(searchError || selectedRootError) && (
            <SearchErrorsComponent
              searchError={searchError}
              selectedRootError={selectedRootError}
            />
          )}
        </div>
      </>
    );
  }
);

ListSearchResults.displayName = "ListSearchResults";

const SearchTitle = memo(
  ({
    radioSearchMethod,
    searchToken,
    searchingScope,
    searchChapters,
    chapterName,
  }: any) => {
    let searchType = radioSearchMethod === "optionRootSearch" ? "??????" : "????????";
    return (
      <h3 className="mb-2 text-info p-1">
        ?????????? ?????????? ???? {searchType} "{searchToken}"
        {searchingScope === SEARCH_SCOPE.ALL_CHAPTERS
          ? " ???? ???? ??????????"
          : searchingScope === SEARCH_SCOPE.MULTIPLE_CHAPTERS
          ? " ???? ?????? " + searchChapters.join(" ??")
          : " ???? ???????? " + chapterName}
      </h3>
    );
  }
);

SearchTitle.displayName = "SearchTitle";

const DerivationsComponent = memo(({ searchIndexes, handleRootClick }: any) => {
  useEffect(() => {
    //init tooltip
    Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]')).forEach(
      (tooltipNode) => new bootstrap.Tooltip(tooltipNode)
    );
  }, [searchIndexes]);

  return (
    <>
      <hr />
      <span className="p-2">
        {searchIndexes.map((root: searchIndexProps, index: number) => (
          <span
            role="button"
            key={index}
            onClick={(e) => handleRootClick(root.key)}
            data-bs-toggle="tooltip"
            data-bs-title={root.text}
          >
            {index ? " -" : " "} {root.name}
          </span>
        ))}
      </span>
      <hr />
    </>
  );
});

DerivationsComponent.displayName = "DerivationsComponent";

const SearchVerseComponent = memo(
  ({
    verse,
    searchingScope,
    verseChapter,
    value,
    isEditable,
    noteDirection,
    isRootSearch,
    searchIndexes,
    dispatchDpAction,
  }: any) => {
    searchIndexes = (searchIndexes as []).filter(
      (value: any) => value.key === verse.key
    );

    return (
      <>
        <VerseContentComponent
          verse={verse}
          searchingScope={searchingScope}
          verseChapter={verseChapter}
          isRootSearch={isRootSearch}
          searchIndexes={searchIndexes}
          dispatchDpAction={dispatchDpAction}
        />
        <InputTextForm
          verseKey={verse.key}
          verseNote={value}
          noteEditable={isEditable}
          noteDirection={noteDirection}
          dispatchDpAction={dispatchDpAction}
        />
      </>
    );
  }
);

SearchVerseComponent.displayName = "SearchVerseComponent";

const SearchErrorsComponent = ({ searchError, selectedRootError }: any) => {
  const { t } = useTranslation();
  return (
    <>
      {searchError && <p className="mt-3 text-danger">{t("search_fail")}</p>}
      {selectedRootError && (
        <p className="mt-3 text-danger">{t("search_root_error")}</p>
      )}
    </>
  );
};

const VerseContentComponent = memo(
  ({
    verse,
    searchingScope,
    verseChapter,
    isRootSearch,
    searchIndexes,
    dispatchDpAction,
  }: any) => {
    const { dispatchAction } = useQuranBrowser();

    let verse_key = verse.key;
    let isLinkable =
      searchingScope === SEARCH_SCOPE.ALL_CHAPTERS ||
      searchingScope === SEARCH_SCOPE.MULTIPLE_CHAPTERS;

    function gotoChapter(chapter: string) {
      dispatchAction(QB_ACTIONS.GOTO_CHAPTER, chapter);
    }

    const handleVerseClick = (verse_key: string) => {
      dispatchDpAction(DP_ACTIONS.SET_SCROLL_KEY, verse_key);
      gotoChapter(verse.suraid);
    };

    return (
      <span className="fs-4">
        <Highlighted
          text={verse.versetext}
          searchIndexes={searchIndexes}
          isRootSearch={isRootSearch}
        />
        (
        {isLinkable ? (
          <button
            className="p-0 border-0 bg-transparent"
            onClick={(e) => handleVerseClick(verse_key)}
          >
            {verseChapter + ":" + verse.verseid}
          </button>
        ) : (
          <button
            className="p-0 border-0 bg-transparent"
            onClick={(e) => handleVerseClick(verse_key)}
          >
            {verse.verseid}
          </button>
        )}
        )
        <button
          className="btn"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target={"#collapseExample" + verse_key}
          aria-expanded="false"
          aria-controls={"collapseExample" + verse_key}
        >
          <ArrowDownCircleFill />
        </button>
      </span>
    );
  }
);

VerseContentComponent.displayName = "VerseContentComponent";

const Highlighted = ({ text = "", searchIndexes, isRootSearch }: any) => {
  const parts = text.split(" ");

  function matchIndex(index: number) {
    for (const searchIndex of searchIndexes) {
      if (Number(searchIndex.wordIndex) === index) {
        return true;
      }
    }
    return false;
  }

  return (
    <span>
      {parts.filter(String).map((part: string, i: number) => {
        return matchIndex(isRootSearch ? i + 1 : i) ? (
          <Fragment key={i}>
            <mark>{part}</mark>{" "}
          </Fragment>
        ) : (
          <span key={i}>{part} </span>
        );
      })}
    </span>
  );
};

const ListTitle = memo(({ chapterName }: any) => {
  return (
    <div className="card-header">
      <h3 className="text-primary text-center">???????? {chapterName}</h3>
    </div>
  );
});

ListTitle.displayName = "ListTitle";

const ListVerses = memo(
  ({
    selectChapter,
    myNotes,
    editableNotes,
    scrollKey,
    areaDirection,
  }: any) => {
    const { chapterNames, allQuranText } = useQuran();
    const { dispatchDpAction } = useDisplayPanel();

    const chapterName = chapterNames[selectChapter - 1].name;
    const versesArray = allQuranText[selectChapter - 1].verses;

    const selectedVerse = useRef<Element | null | undefined>(null);

    interface versesRefType {
      [key: string]: HTMLDivElement;
    }

    const versesRef = useRef<versesRefType>({});

    useEffect(() => {
      let verseToHighlight = versesRef.current[scrollKey];
      if (verseToHighlight) {
        verseToHighlight.scrollIntoView({ block: "center" });
        verseToHighlight.classList.add("verse-selected");
        selectedVerse.current =
          verseToHighlight.firstElementChild?.firstElementChild;
        dispatchDpAction(DP_ACTIONS.SET_SCROLL_KEY, null);
      }
    }, [dispatchDpAction, scrollKey]);

    return (
      <>
        <ListTitle chapterName={chapterName} />
        <div className="card-body">
          {versesArray.map((verse: verseProps) => (
            <VerseComponent
              key={verse.key}
              verse={verse}
              value={myNotes[verse.key] || ""}
              isEditable={editableNotes[verse.key]}
              noteDirection={areaDirection[verse.key] || ""}
              dispatchDpAction={dispatchDpAction}
              selectedVerse={selectedVerse}
              versesRef={versesRef}
            />
          ))}
        </div>
      </>
    );
  }
);

ListVerses.displayName = "ListVerses";

function hightlighVerse(verseElement: HTMLElement) {
  verseElement.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  verseElement.classList.add("verse-selected");
}

const VerseComponent = memo(
  ({
    verse,
    value,
    isEditable,
    noteDirection,
    dispatchDpAction,
    selectedVerse,
    versesRef,
  }: any) => {
    return (
      <div
        ref={(el) => (versesRef.current[verse.key] = el)}
        className="border-bottom pt-1 pb-1"
      >
        <VerseTextComponent verse={verse} selectedVerse={selectedVerse} />
        <InputTextForm
          verseKey={verse.key}
          verseNote={value}
          noteEditable={isEditable}
          noteDirection={noteDirection}
          dispatchDpAction={dispatchDpAction}
        />
      </div>
    );
  }
);

VerseComponent.displayName = "VerseComponent";

const VerseTextComponent = memo(({ verse, selectedVerse }: any) => {
  function onClickVerse(event: React.MouseEvent<HTMLSpanElement, MouseEvent>) {
    let verseElement = event.currentTarget.parentElement?.parentElement;

    if (!verseElement) return;

    if (selectedVerse.current) {
      selectedVerse.current.parentElement?.parentElement?.classList.remove(
        "verse-selected"
      );

      if (selectedVerse.current === event.currentTarget) {
        selectedVerse.current = null;
      } else {
        hightlighVerse(verseElement);
        selectedVerse.current = event.currentTarget;
      }
    } else {
      hightlighVerse(verseElement);
      selectedVerse.current = event.currentTarget;
    }
  }
  return (
    <span className="fs-4">
      {verse.versetext}{" "}
      <span className="btn-verse" onClick={onClickVerse}>
        ({verse.verseid})
      </span>{" "}
      <button
        className="btn"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target={"#collapseExample" + verse.key}
        aria-expanded="false"
        aria-controls={"collapseExample" + verse.key}
      >
        <ArrowDownCircleFill />
      </button>
    </span>
  );
});

VerseTextComponent.displayName = "VerseTextComponent";

const InputTextForm = memo(
  ({
    verseKey,
    verseNote,
    noteEditable,
    noteDirection,
    dispatchDpAction,
  }: any) => {
    const { t } = useTranslation();

    const handleNoteChange = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = event.target;

        dispatchDpAction(DP_ACTIONS.CHANGE_NOTE, { name, value });
      },
      [dispatchDpAction]
    );

    const onInputSubmit = useCallback(
      (key: string, value: string) => {
        saveData("notes", {
          id: key,
          text: value,
          date_created: Date.now(),
          date_modified: Date.now(),
        })
          .then(function () {
            toast.success(t("save_success") as string);
          })
          .catch(function () {
            toast.success(t("save_failed") as string);
          });

        dispatchDpAction(DP_ACTIONS.SUBMIT_NOTE, { name: key });
      },
      [dispatchDpAction, t]
    );

    const handleSetDirection = useCallback(
      (verse_key: string, dir: string) => {
        dispatchDpAction(DP_ACTIONS.CHANGE_NOTE_DIRECTION, {
          name: verse_key,
          value: dir,
        });

        saveData("notes_dir", { id: verse_key, dir: dir });
      },
      [dispatchDpAction]
    );

    const handleEditClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        let inputKey = event.currentTarget.name;

        dispatchDpAction(DP_ACTIONS.CHANGE_NOTE_EDITABLE, {
          name: inputKey,
          value: true,
        });
      },
      [dispatchDpAction]
    );

    return (
      <TextForm
        inputKey={verseKey}
        inputValue={verseNote}
        isEditable={noteEditable}
        inputDirection={noteDirection}
        handleInputChange={handleNoteChange}
        handleEditClick={handleEditClick}
        handleSetDirection={handleSetDirection}
        onInputSubmit={onInputSubmit}
      />
    );
  }
);

InputTextForm.displayName = "InputTextForm";

export default DisplayPanel;
