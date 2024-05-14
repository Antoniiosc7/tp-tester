import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-yamels',
  templateUrl: './yamels.component.html',
  styleUrls: ['./yamels.component.css']
})

export class YamelsComponent implements OnInit {
  p: number = 1;
  searchTerm: string = '';
  sections = [
    {
      id: 'example1',
      content:
        `- uses: "github/getBranches"
      with:
        repoName: "tp-testbench"
      method: "GET"`
    },
    {
      id: 'example2',
      content:
        `- uses: "github/createBranch"
      with:
        repoName: "tp-testbench"
        branchName: "branchNameHere"
      method: "POST"`
    },
    {
      id: 'example3',
      content: `- uses: "github/deleteBranch"
      with:
        repoName: "tp-testbench"
        branchName: "branchNameHere"
      method: "DELETE"`
    },
    {
      id: 'example4',
      content: `- uses: "github/getIssue"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
      method: "GET"`
    },
    {
      id: 'example5',
      content: `- uses: "github/createIssue"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
        title: "titleText"
        body: "bodyText"
      method: "POST"`
    },
    {
      id: 'example6',
      content: `- uses: "github/createPR"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
        title: "title1"
        head: "main"
        base: "branchX"
        body: "bodyText"
      method: "POST"`
    },
    {
      id: 'example7',
      content: `- uses: "github/getOpenPR"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
      method: "GET"`
    },
    {
      id: 'example8',
      content: `- uses: "github/mergePR"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
        prNumber: "1"
        mergeMessage: "mergead"
      method: "PUT"`
    },
    {
      id: 'example9',
      content: `- uses: "github/pullCurrentBranch"
      with:
        repoName: "tp-testbench"
      method: "GET"`
    },
    {
      id: 'example10',
      content: `- uses: "github/createFile"
      with:
        repoName: "tp-testbench"
        fileName: "file.txt"
        fileContent: "content"`
    },
    {
      id: 'example11',
      content: `- uses: "github/commitAllChanges"
      with:
        repoName: "tp-testbench"
        commitMessage: "commit message"
      method: "POST"`
    },
    {
      title: '',
      id: 'example12',
      content: `- uses: "github/pushChanges"
      with:
        repoName: "tp-testbench"
      method: "POST"`
    },
    {
      id: 'example13',
      content: `- uses: "bluejay/compute/tpa"
      with:
        collector: "EVENTS"
        tpa: "tpa-TFG-GH-antoniiosc7_Glassmatrix"
        metric: "working_metric.json"
      method: "POST"`
    },
    {
      id: 'example14',
      content: `- uses: "bluejay/compute/metric"
      with:
        actualTime: "true/false"
        collector: "EVENTS"
        metric: "additions_metric.json"
      method: "POST"`
    },
    {
      id: 'example15',
      content: `- uses: "bluejay/check"
      value: "1" //optional
      with:
        - key: "additions"
          conditions:
            minExpectedValue: "5"
            maxExpectedValue: "12"
        - key: "additions"
          conditions:
            minExpectedValue: "5"
            maxExpectedValue: "12"
        - key: "key1"
          conditions:
            expectedValue: "value1"
      method: "TEST"`
    },
    {
      id: 'example16',
      content: `uses: "github/mergeLastOpenPR"
      with:
        repoName: "tp-testbench"
        owner: "Antoniiosc7"
        mergeMessage: "mergedPR"
      method: "POST"`
    },
    {
      id: 'example17',
      content: `- uses: "bluejay/findCheck"
      with:
        values:
          - value: 1
            computationCount: 1
            evidences:
              login: "Antoniiosc7"
              bodyText: "wip"
      method: "TEST"`
    },
    {
      id: 'example18',
      content: `- uses: "github/deleteFile"
      with:
        repoName: "tp-testbench"
        fileName: "2323232323"`
    }
  ];

  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
    this.sections.forEach(section => {
      this.translate.get('section.' + section.id).subscribe((res: string) => {
        section.title = res;
      });
    });
  }

  copyContent(elementId: string) {
    const copyText = document.getElementById(elementId) as HTMLTextAreaElement;
    copyText.select();
    document.execCommand('copy');
  }
  filteredSections = this.sections; // Add this line

  searchMetric(): void {
    if (this.searchTerm) {
      this.filteredSections = this.sections.filter(section =>
        section.title && section.title.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredSections = this.sections;
    }
  }
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredSections = this.sections;
  }
}
