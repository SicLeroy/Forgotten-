import {
  deleteSaveFromIndexedDb,
  listSavedGames,
  loadGameFromIndexedDb,
  loadLanguagePreference,
  saveGameToIndexedDb,
  saveLanguagePreference,
} from '../storage/indexedDb';

export const SaveManager = {
  saveGame: saveGameToIndexedDb,
  listSaves: listSavedGames,
  loadGame: loadGameFromIndexedDb,
  deleteSave: deleteSaveFromIndexedDb,
  saveLanguage: saveLanguagePreference,
  loadLanguage: loadLanguagePreference,
};
