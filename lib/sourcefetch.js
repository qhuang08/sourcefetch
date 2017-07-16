'use babel';

import { CompositeDisposable } from 'atom';
import request from 'request'
import cheerio from 'cheerio'
import google from 'google'

google.resultsPerPage = 1

export default {

  subscriptions: null,

  activate(state) {


    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'sourcefetch:fetch': () => this.fetch()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },


  fetch() {
    let editor
    let self=this

    if (editor = atom.workspace.getActiveTextEditor()){
      let selection = editor.getSelectedText()
      let language=editor.getGrammar().name
      //let reversed = selection.split(' ').reverse().join(' ')
      //editor.insertText(reversed)
      self.search(selection,language).then((url)=>{
        atom.notifications.addSuccess('Found google result')
        return self.download(url)
      }).then((html)=>{
        let answer = self.scrape(html)
        if(answer ===''){
          atom.notifications.addWarning('No answer found :( ')
        }else{
          atom.notifications.addSuccess('Found snippet!')
          editor.insertText(answer)
        }
      }).catch((error)=>{
        console.log(error)
        atom.notifications.addWarning(error.reason)
      })
    }
  },

  search(query, language) {
    return new Promise((resolve, reject)=>{
      let searchString = `${query} in ${language} site: stackoverflow.com`

      google(searchString, (err,res)=>{
        if(err){
          reject({
            reason: 'A search error has occured :( '
          })
        }else if(res.links.length===0){
          reject({
            reason: 'No results found ...'
          })
        }else{
          resolve(res.links[0].href)
        }
      })
    })
  },

  scrape(html){
    $ = cheerio.load(html)
    return $('div.accepted-answer pre code').text()
  },

  download(url){
    return new Promise((resolve, reject) =>{
      request(url, (error,response,body) =>{
        if(!error && response.statusCode == 200){
          //console.log(body)
          resolve(body)
        }else{
          reject({
            reason: 'Unable to download page'
          })
        }
      })
    })


  }

};
