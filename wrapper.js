const { createApp } = Vue;

const {
  Service, 
  Metadata,
  Context,
} = ORBIS.Core;

createApp({
  data() {
    return {
      canaryFailed: false,
      frameUrl: null,
      report: null,
      reports: [],
    };
  },
  async created() {
    await this.loadReports();
  },
  computed: {
    
  },
  methods: {
    
    async loadReports() {
      const {
        typename = "dashboard",
      } = Context.getQueryStringParameters();

      const params = new URLSearchParams({
        "$filter": `statecode eq 0 and obo_entitylogicalname eq '${typename}'`,
        "$select": "obo_pbireportid,obo_name,obo_url,obo_canaryurl",
        "$expand": "obo_PBIReportParameter_obo_PBIReportId_ob($select=obo_name,obo_type,obo_value)",
      });
      const {data} = await Service.retrieveMultiple("obo_pbireport", params.toString());
      this.reports = data.values.map(({
        obo_pbireportid:id,
        obo_name:name,
        obo_url:url,
        obo_canaryurl:canary,
      }) => ({
        id,
        name,
        url,
        canary,
      }));
    },
    
    async loadReport(report = this.report) {
      Object.assign(this, {
        canaryFailed: false,
        frameUrl: null,
      });

      const {
        id,
        url:base,
        canary,
      } = report;

      if(canary) {
        const result = await this.testCanary(canary);
        if(!result) {
          this.canaryFailed = true;
          return;
        }
      }

      debugger;

      const parameters = await this.loadReportParameters(id);

      const params = new URLSearchParams();
      params.set("rs:embed", "true");

      let record = {};
      const {id:recordId, typename:recordType} = Context.getQueryStringParameters();
      if(recordType && recordId) {
        const resp = await Service.retrieve(recordType, recordId);
        record = resp.data;
      }

      for(const {name,type,value} of parameters) {
        let result = null;

        switch(type) {
          case 880440001: // Static
            result = value;
            break;
          case 880440000: // Field
            result = record[value];
            break;
          case 880440002: // Template
            result = ORBIS.Core.Utils.Template.evaluate(value, record);
            break;
          default:
            throw new Error(`Unknown Parameter Type: ${type}`);
        }

        params.set(name, result);
      }

      const url = `${base}?${params.toString()}`;
      this.frameUrl = url;
    },

    async loadReportParameters(reportid) {
      const resp = await Service.retrieveMultiple("obo_pbireportparameter", new URLSearchParams({
        "$select": "obo_name,obo_type,obo_value",
        "$filter": `statecode eq 0 and _obo_pbireportid_value eq ${reportid}`,
      }).toString());

      return resp.data.values.map(({
        obo_name:name, 
        obo_type:type, 
        obo_value:value
      }) => ({
        name, type, value
      }));
    },

    onFrameError(evt) {
      console.log("Frame error");
    },

    onFrameLoad(evt) {
      console.log("Frame loaded");
    },

    onReportChanged() {
      this.frameUrl = null;

      const {report} = this;
      if(report) this.loadReport();
    },

    testCanary(url) {
      return new Promise((res, rej) => {
        const img = document.createElement("img");
        img.src = url;
        img.addEventListener("load", () => {
          document.body.removeChild(img);
          res(true);
        });
        img.addEventListener("error", () => {
          document.body.removeChild(img);
          res(false);
        });

        document.body.appendChild(img);
      });
    }
  }
}).mount('#app')

