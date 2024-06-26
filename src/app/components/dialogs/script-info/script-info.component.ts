import { Component, OnInit } from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-script-info',
  templateUrl: './script-info.component.html',
  styleUrls: ['./script-info.component.css']
})
export class ScriptInfoComponent implements OnInit {

  guideText = '';

  constructor(public dialogRef: MatDialogRef<ScriptInfoComponent>) {}

  close(): void {
    this.dialogRef.close(this.guideText);
  }

  ngOnInit(): void {
  }
  copyContent(id: string) {
    const text = document.getElementById(id) as HTMLTextAreaElement;
    navigator.clipboard.writeText(text.value).then(() => {
      this.close();
    }, err => {
      console.error('Could not copy text: ', err);
    });
  }
}
